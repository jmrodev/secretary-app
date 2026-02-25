const googleCalendarService = require('../google/GoogleCalendarService');
const holidayRepository = require('../../repositories/holidayRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const appointmentRepository = require('../../repositories/appointmentRepository');

/**
 * AvailabilitySearchService
 * Handles searching for free slots (single or batch).
 */
class AvailabilitySearchService {
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
        const [datePart] = dateInput.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    async getNextFreeSlot({ doctor_id, start_date, direction = 'next', include_out_of_hours = 'false' }) {
        const doc = await doctorRepository.getDoctorConfig(doctor_id);
        if (!doc) throw new Error("Doctor not found");

        const duration = doc.appointment_duration || 60;
        const overturnStart = doc.overturn_start_time || '08:00:00';
        const overturnEnd = doc.overturn_end_time || '21:00:00';
        const forceAlignment = doc.force_hour_alignment === 1;

        let currentDay = this._parseLocalDate(start_date);
        const initialSearchDate = (start_date && typeof start_date === 'string' && start_date.includes('T'))
            ? new Date(start_date)
            : (start_date ? this._parseLocalDate(start_date) : new Date());
        const now = new Date();

        const maxDays = 90;
        let daysChecked = 0;
        let foundRegular = null, foundBreak = null;

        const rangeMin = new Date(currentDay), rangeMax = new Date(currentDay);
        if (direction === 'next') rangeMax.setDate(rangeMax.getDate() + maxDays);
        else rangeMin.setDate(rangeMin.getDate() - maxDays);

        const tMin = rangeMin.toISOString(), tMax = rangeMax.toISOString();
        const dMin = tMin.split('T')[0], dMax = tMax.split('T')[0];

        let googleBusyAll = [];
        try { googleBusyAll = await googleCalendarService.getBusyIntervals(doctor_id, tMin, tMax); } catch (e) { }

        const holidays = await holidayRepository.getHolidaysInRange(dMin, dMax);
        const holidayDates = new Set(holidays);
        const schedulesAll = await doctorRepository.getDoctorSchedules(doctor_id);
        const existingApptsAll = await appointmentRepository.findInRange(doctor_id, tMin, tMax, ['cancelled', 'absent', 'suspended']);
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

            const standardBlocks = schedulesAll.filter(s => s.day_of_week === dayOfWeek).sort((a, b) => direction === 'next' ? a.start_time.localeCompare(b.start_time) : b.start_time.localeCompare(a.start_time));
            let dayBlocks = (include_out_of_hours === 'true') ? this._injectOutOfHoursGaps(standardBlocks, overturnStart, overturnEnd, direction) : standardBlocks;

            if (dayBlocks.length === 0) {
                currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                daysChecked++;
                continue;
            }

            for (const block of dayBlocks) {
                if (foundRegular && foundBreak) break;
                const blockStart = new Date(currentDay); const [sh, sm] = block.start_time.split(':'); blockStart.setHours(sh, sm, 0, 0);
                const blockEnd = new Date(currentDay); const [eh, em] = block.end_time.split(':'); blockEnd.setHours(eh, em, 0, 0);
                const isBreakBlock = block.is_break === 1;

                let timeCursor;
                if (direction === 'next') {
                    timeCursor = new Date(Math.max(blockStart.getTime(), initialSearchDate.getTime() + 60000, now.getTime() + 60000));
                    while (timeCursor.getTime() < blockEnd.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const blockForce = (block.force_hour_alignment !== undefined) ? (block.force_hour_alignment === 1) : forceAlignment;
                        let currentSlotDuration = (blockForce && timeCursor.getMinutes() !== 0) ? (60 - timeCursor.getMinutes()) : duration;
                        const slotEndMs = slotStartMs + currentSlotDuration * 60000;
                        if (slotEndMs > blockEnd.getTime()) break;
                        if (!this._isBusy(slotStartMs, slotEndMs, apptIntervals, googleBusyAll)) {
                            if (isBreakBlock) { if (!foundBreak) foundBreak = new Date(timeCursor); }
                            else { if (!foundRegular) foundRegular = new Date(timeCursor); }
                        }
                        if (foundRegular || foundBreak) break;
                        timeCursor = new Date(slotEndMs);
                    }
                } else {
                    const latestSrc = Math.min(blockEnd.getTime() - duration * 60000, initialSearchDate.getTime() - duration * 60000);
                    if (latestSrc < blockStart.getTime() || latestSrc < now.getTime()) continue;
                    const steps = Math.floor((latestSrc - blockStart.getTime()) / (duration * 60000));
                    timeCursor = new Date(blockStart.getTime() + steps * (duration * 60000));
                    while (timeCursor.getTime() >= blockStart.getTime() && timeCursor.getTime() >= now.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const slotEndMs = slotStartMs + duration * 60000;
                        if (!this._isBusy(slotStartMs, slotEndMs, apptIntervals, googleBusyAll)) {
                            if (isBreakBlock) { if (!foundBreak) foundBreak = new Date(timeCursor); }
                            else { if (!foundRegular) foundRegular = new Date(timeCursor); }
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
        return { slot: foundRegular, breakSlot: foundBreak, doctor_id, direction };
    }

    async getFreeSlotsBatch(doctor_id, start_date, include_out_of_hours) {
        const doc = await doctorRepository.getDoctorConfig(doctor_id);
        if (!doc) throw new Error("Doctor not found");
        const duration = doc.appointment_duration || 60;
        const overturnStart = doc.overturn_start_time || '08:00:00';
        const overturnEnd = doc.overturn_end_time || '21:00:00';
        const forceAlignment = doc.force_hour_alignment === 1;

        let currentDay = this._parseLocalDate(start_date);
        const now = new Date(); const todayZero = new Date(now); todayZero.setHours(0, 0, 0, 0);
        if (currentDay < todayZero) currentDay = new Date(todayZero);

        const maxDaysToCheck = 90; let daysChecked = 0;
        const rangeMax = new Date(currentDay); rangeMax.setDate(rangeMax.getDate() + maxDaysToCheck);
        const tMin = currentDay.toISOString(), tMax = rangeMax.toISOString();
        const dMin = tMin.split('T')[0], dMax = tMax.split('T')[0];

        let googleBusyAll = []; try { googleBusyAll = await googleCalendarService.getBusyIntervals(doctor_id, tMin, tMax); } catch (e) { }
        const holidays = await holidayRepository.getHolidaysInRange(dMin, dMax);
        const holidayDates = new Set(holidays);
        const schedulesAll = await doctorRepository.getDoctorSchedules(doctor_id);
        const existingApptsAll = await appointmentRepository.findInRange(doctor_id, tMin, tMax, ['cancelled', 'absent', 'suspended']);
        const apptIntervals = existingApptsAll.map(a => ({
            start: new Date(a.appointment_date).getTime(),
            end: new Date(a.appointment_date).getTime() + (a.duration || duration) * 60000
        }));

        const results = [];
        while (daysChecked < maxDaysToCheck) {
            const dayOfWeek = currentDay.getDay();
            const dateStr = this._getDateStr(currentDay);
            if (holidayDates.has(dateStr)) { currentDay.setDate(currentDay.getDate() + 1); currentDay.setHours(0, 0, 0, 0); daysChecked++; continue; }

            const standardBlocks = schedulesAll.filter(s => s.day_of_week === dayOfWeek).sort((a, b) => a.start_time.localeCompare(b.start_time));
            let dayBlocks = include_out_of_hours ? this._injectOutOfHoursGaps(standardBlocks, overturnStart, overturnEnd, 'next') : standardBlocks;

            if (dayBlocks.length > 0) {
                const daySlots = [];
                for (const block of dayBlocks) {
                    const blockStart = new Date(currentDay); const [sh, sm] = block.start_time.split(':'); blockStart.setHours(sh, sm, 0, 0);
                    const blockEnd = new Date(currentDay); const [eh, em] = block.end_time.split(':'); blockEnd.setHours(eh, em, 0, 0);
                    let timeCursor = new Date(blockStart);
                    if (timeCursor < now) { const diff = now.getTime() - timeCursor.getTime(); if (diff > 0) { const steps = Math.ceil(diff / (duration * 60000)); timeCursor = new Date(timeCursor.getTime() + steps * (duration * 60000)); } }

                    while (timeCursor.getTime() < blockEnd.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const blockForce = (block.force_hour_alignment !== undefined) ? (block.force_hour_alignment === 1) : forceAlignment;
                        let currentSlotDuration = (blockForce && timeCursor.getMinutes() !== 0) ? (60 - timeCursor.getMinutes()) : duration;
                        const slotEndMs = slotStartMs + currentSlotDuration * 60000;
                        if (slotEndMs > blockEnd.getTime()) break;

                        if (!this._isBusy(slotStartMs, slotEndMs, apptIntervals, googleBusyAll)) {
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
                    results.push({ date: dateStr, dayName: currentDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }), slots: daySlots });
                }
            }
            currentDay.setDate(currentDay.getDate() + 1); currentDay.setHours(0, 0, 0, 0); daysChecked++;
        }
        return { results, nextStartDate: currentDay.toISOString().split('T')[0] };
    }

    _isBusy(start, end, apptIntervals, googleIntervals) {
        return apptIntervals.some(a => (start < a.end && end > a.start)) ||
            googleIntervals.some(b => { const bs = new Date(b.start).getTime(); const be = new Date(b.end).getTime(); return (start < be && end > bs); });
    }

    _injectOutOfHoursGaps(standardBlocks, start, end, direction) {
        let dayBlocks = [];
        let cursor = (direction === 'next') ? start : end;
        const sorted = [...standardBlocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (direction === 'next') {
            for (const sb of sorted) {
                if (sb.start_time > cursor) dayBlocks.push({ start_time: cursor, end_time: sb.start_time, is_break: 0, is_out_of_hours_gap: true });
                dayBlocks.push(sb); cursor = (sb.end_time > cursor) ? sb.end_time : cursor;
            }
            if (end > cursor) dayBlocks.push({ start_time: cursor, end_time: end, is_break: 0, is_out_of_hours_gap: true });
        } else {
            const revSorted = [...sorted].reverse(); let revCursor = end;
            for (const sb of revSorted) {
                if (sb.end_time < revCursor) dayBlocks.push({ start_time: sb.end_time, end_time: revCursor, is_break: 0, is_out_of_hours_gap: true });
                dayBlocks.push(sb); revCursor = (sb.start_time < revCursor) ? sb.start_time : revCursor;
            }
            if (start < revCursor) dayBlocks.push({ start_time: start, end_time: revCursor, is_break: 0, is_out_of_hours_gap: true });
            dayBlocks.sort((a, b) => b.start_time.localeCompare(a.start_time));
        }
        return dayBlocks;
    }
}

module.exports = new AvailabilitySearchService();
