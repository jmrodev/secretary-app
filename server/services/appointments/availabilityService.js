const scheduleProvider = require('./providers/scheduleProvider');
const busyProvider = require('./providers/busyProvider');
const googleController = require('../../controllers/googleController');
const { pool } = require('../../db');

class AvailabilityService {
    _getDateStr(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    _parseLocalDate(dateInput) {
        if (!dateInput) return new Date();
        if (dateInput instanceof Date) return new Date(dateInput);

        // Handle "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss"
        const [datePart] = dateInput.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    async getNextFreeSlot({ doctor_id, start_date, direction = 'next', include_out_of_hours = 'false' }) {
        const conn = await pool.getConnection();
        try {
            const doc = await scheduleProvider.getDoctorConfig(doctor_id, conn);
            const duration = doc.appointment_duration || 60;
            const overturnStart = doc.overturn_start_time || '08:00:00';
            const overturnEnd = doc.overturn_end_time || '21:00:00';
            const forceAlignment = doc.force_hour_alignment === 1;

            let currentDay = this._parseLocalDate(start_date);
            const initialSearchDate = (start_date && typeof start_date === 'string' && start_date.includes('T'))
                ? new Date(start_date) // If it's a full ISO string, use it
                : (start_date ? this._parseLocalDate(start_date) : new Date());
            const now = new Date();

            const maxDays = 90;
            let daysChecked = 0;
            let foundRegular = null;
            let foundBreak = null;

            const rangeMin = new Date(currentDay);
            const rangeMax = new Date(currentDay);
            if (direction === 'next') {
                rangeMax.setDate(rangeMax.getDate() + maxDays);
            } else {
                rangeMin.setDate(rangeMin.getDate() - maxDays);
            }

            const tMin = rangeMin.toISOString();
            const tMax = rangeMax.toISOString();
            const dMin = tMin.split('T')[0];
            const dMax = tMax.split('T')[0];

            let googleBusyAll = [];
            try {
                googleBusyAll = await googleController.getBusyIntervals(doctor_id, tMin, tMax);
            } catch (gErr) {
                console.warn("Google Busy pre-fetch failed", gErr.message);
            }

            const holidaysRows = await conn.query("SELECT DATE_FORMAT(date, '%Y-%m-%d') as dateStr FROM active_holidays WHERE date >= ? AND date <= ?", [dMin, dMax]);
            const holidayDates = new Set(holidaysRows.map(h => h.dateStr));

            const schedulesAll = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ?", [doctor_id]);

            const existingApptsAll = await conn.query(
                "SELECT appointment_date, duration FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? AND status NOT IN ('cancelled', 'rescheduled')",
                [doctor_id, tMin, tMax]
            );
            const apptIntervals = existingApptsAll.map(a => ({
                start: new Date(a.appointment_date).getTime(),
                end: new Date(a.appointment_date).getTime() + (a.duration || duration) * 60000
            }));

            while (daysChecked < maxDays) {
                const dayOfWeek = currentDay.getDay();
                const dateStr = this._getDateStr(currentDay);

                if (holidayDates.has(dateStr)) {
                    currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                    if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                    daysChecked++;
                    continue;
                }

                const standardBlocks = schedulesAll
                    .filter(s => s.day_of_week === dayOfWeek)
                    .sort((a, b) => direction === 'next'
                        ? a.start_time.localeCompare(b.start_time)
                        : b.start_time.localeCompare(a.start_time)
                    );

                let dayBlocks = [];
                if (include_out_of_hours === 'true') {
                    let cursor = (direction === 'next') ? overturnStart : overturnEnd;
                    const sortedStandard = [...standardBlocks].sort((a, b) => a.start_time.localeCompare(b.start_time));

                    if (direction === 'next') {
                        for (const sb of sortedStandard) {
                            if (sb.start_time > cursor) {
                                dayBlocks.push({ start_time: cursor, end_time: sb.start_time, is_break: 0, is_out_of_hours_gap: true });
                            }
                            dayBlocks.push(sb);
                            cursor = (sb.end_time > cursor) ? sb.end_time : cursor;
                        }
                        if (overturnEnd > cursor) {
                            dayBlocks.push({ start_time: cursor, end_time: overturnEnd, is_break: 0, is_out_of_hours_gap: true });
                        }
                    } else {
                        const revSorted = [...sortedStandard].reverse();
                        let revCursor = overturnEnd;
                        for (const sb of revSorted) {
                            if (sb.end_time < revCursor) {
                                dayBlocks.push({ start_time: sb.end_time, end_time: revCursor, is_break: 0, is_out_of_hours_gap: true });
                            }
                            dayBlocks.push(sb);
                            revCursor = (sb.start_time < revCursor) ? sb.start_time : revCursor;
                        }
                        if (overturnStart < revCursor) {
                            dayBlocks.push({ start_time: overturnStart, end_time: revCursor, is_break: 0, is_out_of_hours_gap: true });
                        }
                        dayBlocks.sort((a, b) => b.start_time.localeCompare(a.start_time));
                    }
                } else {
                    dayBlocks = standardBlocks;
                }

                if (dayBlocks.length === 0) {
                    currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                    if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                    daysChecked++;
                    continue;
                }

                for (const block of dayBlocks) {
                    if (foundRegular && foundBreak) break;

                    const blockStart = new Date(currentDay);
                    const [sh, sm] = block.start_time.split(':');
                    blockStart.setHours(sh, sm, 0, 0);

                    const blockEnd = new Date(currentDay);
                    const [eh, em] = block.end_time.split(':');
                    blockEnd.setHours(eh, em, 0, 0);

                    const isBreakBlock = block.is_break === 1;

                    let timeCursor;
                    if (direction === 'next') {
                        timeCursor = new Date(Math.max(blockStart.getTime(), initialSearchDate.getTime() + 60000, now.getTime() + 60000));
                    } else {
                        const latestPossible = Math.min(blockEnd.getTime() - duration * 60000, initialSearchDate.getTime() - duration * 60000);
                        if (latestPossible < blockStart.getTime() || latestPossible < now.getTime()) continue;
                        const diff = latestPossible - blockStart.getTime();
                        const steps = Math.floor(diff / (duration * 60000));
                        timeCursor = new Date(blockStart.getTime() + steps * (duration * 60000));
                    }

                    if (direction === 'next') {
                        while (timeCursor.getTime() < blockEnd.getTime()) {
                            const slotStartMs = timeCursor.getTime();
                            let currentSlotDuration = duration;
                            const blockForce = (block.force_hour_alignment !== undefined) ? (block.force_hour_alignment === 1) : forceAlignment;
                            if (blockForce && timeCursor.getMinutes() !== 0) {
                                currentSlotDuration = 60 - timeCursor.getMinutes();
                            }
                            const slotEndMs = slotStartMs + currentSlotDuration * 60000;
                            if (slotEndMs > blockEnd.getTime()) break;

                            const isBusy =
                                apptIntervals.some(app => (slotStartMs < app.end && slotEndMs > app.start)) ||
                                googleBusyAll.some(b => {
                                    const bStart = new Date(b.start).getTime();
                                    const bEnd = new Date(b.end).getTime();
                                    return (slotStartMs < bEnd && slotEndMs > bStart);
                                });

                            if (!isBusy) {
                                if (isBreakBlock) {
                                    if (!foundBreak) foundBreak = new Date(timeCursor);
                                } else {
                                    if (!foundRegular) foundRegular = new Date(timeCursor);
                                }
                            }
                            if (foundRegular || foundBreak) break;
                            timeCursor = new Date(slotEndMs);
                        }
                    } else {
                        while (timeCursor.getTime() >= blockStart.getTime() && timeCursor.getTime() >= now.getTime()) {
                            const slotStartMs = timeCursor.getTime();
                            const slotEndMs = slotStartMs + duration * 60000;

                            const isBusy =
                                apptIntervals.some(app => (slotStartMs < app.end && slotEndMs > app.start)) ||
                                googleBusyAll.some(b => {
                                    const bStart = new Date(b.start).getTime();
                                    const bEnd = new Date(b.end).getTime();
                                    return (slotStartMs < bEnd && slotEndMs > bStart);
                                });

                            if (!isBusy) {
                                if (isBreakBlock) {
                                    if (!foundBreak) foundBreak = new Date(timeCursor);
                                } else {
                                    if (!foundRegular) foundRegular = new Date(timeCursor);
                                }
                            }
                            if (foundRegular || foundBreak) break;
                            timeCursor = new Date(timeCursor.getTime() - duration * 60000);
                        }
                    }
                }

                if (foundRegular || foundBreak) break;

                currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                if (direction === 'previous' && currentDay < now) break;

                daysChecked++;
            }

            return {
                slot: foundRegular,
                breakSlot: foundBreak,
                doctor_id,
                direction
            };
        } finally {
            conn.release();
        }
    }

    async getFreeSlotsBatch(doctor_id, start_date, include_out_of_hours) {
        const conn = await pool.getConnection();
        try {
            const doc = await scheduleProvider.getDoctorConfig(doctor_id, conn);
            const duration = doc.appointment_duration || 60;
            const overturnStart = doc.overturn_start_time || '08:00:00';
            const overturnEnd = doc.overturn_end_time || '21:00:00';
            const forceAlignment = doc.force_hour_alignment === 1;

            let currentDay = this._parseLocalDate(start_date);
            const now = new Date();
            const todayZero = new Date(now); todayZero.setHours(0, 0, 0, 0);
            if (currentDay < todayZero) currentDay = new Date(todayZero);

            const limitDaysWithSlots = 20;
            const maxDaysToCheck = 90;
            let daysChecked = 0;
            let daysFound = 0;

            const rangeMax = new Date(currentDay);
            rangeMax.setDate(rangeMax.getDate() + maxDaysToCheck);

            const tMin = currentDay.toISOString();
            const tMax = rangeMax.toISOString();
            const dMin = tMin.split('T')[0];
            const dMax = tMax.split('T')[0];

            let googleBusyAll = [];
            try {
                googleBusyAll = await googleController.getBusyIntervals(doctor_id, tMin, tMax);
            } catch (gErr) {
                console.warn("Google Busy pre-fetch failed", gErr.message);
            }

            const holidaysRows = await conn.query("SELECT DATE_FORMAT(date, '%Y-%m-%d') as dateStr FROM active_holidays WHERE date >= ? AND date <= ?", [dMin, dMax]);
            const holidayDates = new Set(holidaysRows.map(h => h.dateStr));

            const schedulesAll = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ?", [doctor_id]);

            const existingApptsAll = await conn.query(
                "SELECT appointment_date, duration FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? AND status NOT IN ('cancelled')",
                [doctor_id, tMin, tMax]
            );
            const apptIntervals = existingApptsAll.map(a => ({
                start: new Date(a.appointment_date).getTime(),
                end: new Date(a.appointment_date).getTime() + (a.duration || duration) * 60000
            }));

            const results = [];

            while (daysChecked < maxDaysToCheck && daysFound < limitDaysWithSlots) {
                const dayOfWeek = currentDay.getDay();
                const dateStr = this._getDateStr(currentDay);

                if (holidayDates.has(dateStr)) {
                    currentDay.setDate(currentDay.getDate() + 1);
                    currentDay.setHours(0, 0, 0, 0);
                    daysChecked++;
                    continue;
                }

                const standardBlocks = schedulesAll
                    .filter(s => s.day_of_week === dayOfWeek)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));

                let dayBlocks = [];
                if (include_out_of_hours) {
                    let cursor = overturnStart;
                    for (const sb of standardBlocks) {
                        if (sb.start_time > cursor) {
                            dayBlocks.push({ start_time: cursor, end_time: sb.start_time, is_break: 0, is_out_of_hours_gap: true });
                        }
                        dayBlocks.push(sb);
                        cursor = (sb.end_time > cursor) ? sb.end_time : cursor;
                    }
                    if (overturnEnd > cursor) {
                        dayBlocks.push({ start_time: cursor, end_time: overturnEnd, is_break: 0, is_out_of_hours_gap: true });
                    }
                } else {
                    dayBlocks = standardBlocks;
                }

                if (dayBlocks.length > 0) {
                    const daySlots = [];
                    for (const block of dayBlocks) {
                        const blockStart = new Date(currentDay);
                        const [sh, sm] = block.start_time.split(':');
                        blockStart.setHours(sh, sm, 0, 0);

                        const blockEnd = new Date(currentDay);
                        const [eh, em] = block.end_time.split(':');
                        blockEnd.setHours(eh, em, 0, 0);

                        let timeCursor = new Date(blockStart);
                        if (timeCursor < now) {
                            const diff = now.getTime() - timeCursor.getTime();
                            if (diff > 0) {
                                const steps = Math.ceil(diff / (duration * 60000));
                                timeCursor = new Date(timeCursor.getTime() + steps * (duration * 60000));
                            }
                        }

                        while (timeCursor.getTime() < blockEnd.getTime()) {
                            const slotStartMs = timeCursor.getTime();
                            let currentSlotDuration = duration;
                            const blockForce = (block.force_hour_alignment !== undefined) ? (block.force_hour_alignment === 1) : forceAlignment;
                            if (blockForce && timeCursor.getMinutes() !== 0) {
                                currentSlotDuration = 60 - timeCursor.getMinutes();
                            }
                            const slotEndMs = slotStartMs + currentSlotDuration * 60000;
                            if (slotEndMs > blockEnd.getTime()) break;

                            const isBusy =
                                apptIntervals.some(app => (slotStartMs < app.end && slotEndMs > app.start)) ||
                                googleBusyAll.some(b => {
                                    const bStart = new Date(b.start).getTime();
                                    const bEnd = new Date(b.end).getTime();
                                    return (slotStartMs < bEnd && slotEndMs > bStart);
                                });

                            if (!isBusy) {
                                daySlots.push({
                                    time: timeCursor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    iso: timeCursor.toISOString(),
                                    is_break: block.is_break === 1,
                                    is_out_of_hours: block.is_out_of_hours_gap || false
                                });
                            }
                            timeCursor = new Date(slotEndMs);
                        }
                    }

                    if (daySlots.length > 0) {
                        results.push({
                            date: dateStr,
                            dayName: currentDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                            slots: daySlots
                        });
                        daysFound++;
                    }
                }

                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0);
                daysChecked++;
            }

            return {
                results,
                nextStartDate: currentDay.toISOString().split('T')[0]
            };
        } finally {
            conn.release();
        }
    }

    async getCalendarStats(year, month, doctor_id) {
        const conn = await pool.getConnection();
        try {
            const docRows = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [doctor_id]);
            const duration = (docRows.length > 0 && docRows[0].appointment_duration) ? docRows[0].appointment_duration : 60;

            const settingRows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'daily_out_of_hours_limit'");
            const outOfHoursLimit = (settingRows.length > 0) ? parseInt(settingRows[0].setting_value, 10) : 0;

            const schedules = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ?", [doctor_id]);

            const lastDay = new Date(year, month, 0).getDate();
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const holidaysRows = await conn.query("SELECT DATE_FORMAT(date, '%Y-%m-%d') as dateStr FROM active_holidays WHERE date BETWEEN ? AND ?", [startDate, endDate]);
            const holidays = new Set(holidaysRows.map(h => h.dateStr));

            const appts = await conn.query(
                "SELECT appointment_date, is_out_of_hours, status FROM appointments WHERE doctor_id = ? AND date(appointment_date) BETWEEN ? AND ? AND status NOT IN ('cancelled', 'absent', 'suspended', 'rejected')",
                [doctor_id, startDate, endDate]
            );

            const stats = {};
            for (let d = 1; d <= lastDay; d++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const currentObj = new Date(year, month - 1, d);
                const dayOfWeek = currentObj.getDay();

                if (holidays.has(dateStr)) {
                    stats[dateStr] = { freeIn: 0, freeOut: 0, totalIn: 0, bookedIn: 0, bookedOut: 0, isHoliday: true };
                    continue;
                }

                let capacityIn = 0;
                const dayScheds = schedules.filter(s => s.day_of_week === dayOfWeek && !s.is_break);
                dayScheds.forEach(s => {
                    const [sh, sm] = s.start_time.split(':');
                    const [eh, em] = s.end_time.split(':');
                    const startMins = parseInt(sh) * 60 + parseInt(sm);
                    const endMins = parseInt(eh) * 60 + parseInt(em);
                    const diff = endMins - startMins;
                    capacityIn += Math.floor(diff / duration);
                });

                const dailyAppts = appts.filter(a => {
                    const aDateStr = new Date(a.appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).substring(0, 10);
                    return aDateStr === dateStr;
                });

                const bookedIn = dailyAppts.filter(a => !a.is_out_of_hours).length;
                const bookedOut = dailyAppts.filter(a => a.is_out_of_hours).length;

                const freeIn = Math.max(0, capacityIn - bookedIn);
                const freeOut = Math.max(0, outOfHoursLimit - bookedOut);

                stats[dateStr] = {
                    freeIn,
                    freeOut,
                    totalIn: capacityIn,
                    bookedIn,
                    bookedOut,
                    isHoliday: false
                };
            }
            return stats;
        } finally {
            conn.release();
        }
    }
}

module.exports = new AvailabilityService();
