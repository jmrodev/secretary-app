const doctorRepository = require('../../repositories/user/doctorRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');

class DailyScheduleService {
    async getDailySchedule(doctorId, dateStr) {
        // 1. Fetch Doctor Config & Schedules
        const doc = await doctorRepository.getDoctorConfig(doctorId);
        const duration = doc?.appointment_duration || 60;
        const overturnStart = doc?.overturn_start_time || '08:00:00';
        const overturnEnd = doc?.overturn_end_time || '21:00:00';

        const schedules = await doctorRepository.getDoctorSchedules(doctorId);

        // 2. Parse Date and Day of Week
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Filter schedules for this specific day of the week
        const dayBlocks = (schedules || []).filter(s => s.day_of_week === dayOfWeek);
        const officialBlocks = dayBlocks.filter(s => !s.is_break).sort((a, b) => a.start_time.localeCompare(b.start_time));
        const breakBlocks = dayBlocks.filter(s => s.is_break).sort((a, b) => a.start_time.localeCompare(b.start_time));

        // 3. Query Holiday status and Appointments
        const isHoliday = (await holidayRepository.getHolidaysInRange(dateStr, dateStr)).length > 0;
        const appointments = await appointmentRepository.findDetailedByDoctorAndDate(doctorId, dateStr);

        // Time helpers
        const timeToMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const minsToTime = (m) => {
            const h = Math.floor(m / 60);
            const min = m % 60;
            return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
        };

        const dayStartMins = timeToMins(overturnStart);
        const dayEndMins = timeToMins(overturnEnd);

        // 4. Generate structured canonical slots for the entire day [dayStartMins, dayEndMins)
        const canonicalSlots = [];
        let cursorMins = dayStartMins;

        const definedBlocks = [
            ...officialBlocks.map(b => ({ ...b, type: 'official' })),
            ...breakBlocks.map(b => ({ ...b, type: 'break' }))
        ].sort((a, b) => timeToMins(a.start_time) - timeToMins(b.start_time));

        for (const block of definedBlocks) {
            const blockStartMins = timeToMins(block.start_time);
            const blockEndMins = timeToMins(block.end_time);

            // If there's an out-of-hours gap before this block, fill it
            while (cursorMins < blockStartMins) {
                const nextSlotEnd = Math.min(cursorMins + duration, blockStartMins);
                canonicalSlots.push({
                    startMins: cursorMins,
                    endMins: nextSlotEnd,
                    slot_time: minsToTime(cursorMins),
                    slot_status: isHoliday ? 'closed_holiday' : 'out_of_hours',
                    is_out_of_hours: 1
                });
                cursorMins = nextSlotEnd;
            }

            // Generate slots for this block
            const isBreak = block.type === 'break';
            while (cursorMins < blockEndMins) {
                const nextSlotEnd = Math.min(cursorMins + duration, blockEndMins);
                canonicalSlots.push({
                    startMins: cursorMins,
                    endMins: nextSlotEnd,
                    slot_time: minsToTime(cursorMins),
                    slot_status: isHoliday ? 'closed_holiday' : (isBreak ? 'break' : 'free'),
                    is_out_of_hours: 0
                });
                cursorMins = nextSlotEnd;
            }
        }

        // Fill any remaining out-of-hours after all defined blocks until dayEndMins
        while (cursorMins < dayEndMins) {
            const nextSlotEnd = Math.min(cursorMins + duration, dayEndMins);
            canonicalSlots.push({
                startMins: cursorMins,
                endMins: nextSlotEnd,
                slot_time: minsToTime(cursorMins),
                slot_status: isHoliday ? 'closed_holiday' : 'out_of_hours',
                is_out_of_hours: 1
            });
            cursorMins = nextSlotEnd;
        }

        // If no blocks defined at all, fill entire day as out_of_hours
        if (definedBlocks.length === 0 && canonicalSlots.length === 0) {
            while (cursorMins < dayEndMins) {
                const nextSlotEnd = Math.min(cursorMins + duration, dayEndMins);
                canonicalSlots.push({
                    startMins: cursorMins,
                    endMins: nextSlotEnd,
                    slot_time: minsToTime(cursorMins),
                    slot_status: isHoliday ? 'closed_holiday' : 'out_of_hours',
                    is_out_of_hours: 1
                });
                cursorMins = nextSlotEnd;
            }
        }

        // 5. Map each appointment to its containing canonical slot
        const slotAppointmentsMap = new Map();
        const unassignedAppointments = [];

        appointments.forEach(appt => {
            const apptDateObj = new Date(appt.appointment_date);
            const apptTimeStr = apptDateObj.toLocaleTimeString('en-GB', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }) + ':00';
            const apptMins = timeToMins(apptTimeStr);

            // Find matching containing slot
            const matchedSlot = canonicalSlots.find(s => apptMins >= s.startMins && apptMins < s.endMins);
            if (matchedSlot) {
                if (!slotAppointmentsMap.has(matchedSlot.slot_time)) {
                    slotAppointmentsMap.set(matchedSlot.slot_time, []);
                }
                slotAppointmentsMap.get(matchedSlot.slot_time).push({ ...appt, exact_time: apptTimeStr });
            } else {
                unassignedAppointments.push({ ...appt, exact_time: apptTimeStr, apptMins });
            }
        });

        // Unassigned appointments outside day bounds
        unassignedAppointments.forEach(appt => {
            const timeStr = appt.exact_time;
            if (!canonicalSlots.some(s => s.slot_time === timeStr)) {
                canonicalSlots.push({
                    startMins: appt.apptMins,
                    endMins: appt.apptMins + duration,
                    slot_time: timeStr,
                    slot_status: isHoliday ? 'closed_holiday' : 'out_of_hours',
                    is_out_of_hours: 1
                });
            }
            if (!slotAppointmentsMap.has(timeStr)) {
                slotAppointmentsMap.set(timeStr, []);
            }
            slotAppointmentsMap.get(timeStr).push(appt);
        });

        // Sort canonicalSlots chronologically
        canonicalSlots.sort((a, b) => a.startMins - b.startMins);

        // 6. Map to final output contract
        const resultRows = [];
        canonicalSlots.forEach(slot => {
            const matchingAppts = slotAppointmentsMap.get(slot.slot_time) || [];
            if (matchingAppts.length > 0) {
                matchingAppts.forEach(appt => {
                    resultRows.push({
                        id: appt.id,
                        appointment_date: appt.appointment_date,
                        doctor_id: Number(doctorId),
                        doctor_name: appt.doctor_name || doc?.full_name || '',
                        patient_id: appt.patient_id,
                        patient_name: appt.patient_name || null,
                        patient_phone: appt.patient_phone || '-',
                        status: appt.status,
                        reason: appt.reason || '-',
                        type: appt.type,
                        is_out_of_hours: !!slot.is_out_of_hours,
                        paid_amount: Number(appt.paid_amount || 0),
                        pending_amount: Number(appt.pending_amount || 0),
                        cost: Number(appt.cost || 0),
                        payment_status: appt.payment_status,
                        is_paid: !!appt.is_paid,
                        rescheduled_from_date: appt.rescheduled_from_date,
                        created_at: appt.created_at,
                        confirmed_at: appt.confirmed_at,
                        arrived_at: appt.arrived_at,
                        completed_at: appt.completed_at,
                        paid_at: appt.paid_at,
                        slot_date: dateStr,
                        slot_time: slot.slot_time,
                        slot_status: 'taken'
                    });
                });
            } else {
                resultRows.push({
                    id: null,
                    appointment_date: null,
                    doctor_id: Number(doctorId),
                    doctor_name: doc?.full_name || '',
                    patient_id: null,
                    patient_name: null,
                    patient_phone: null,
                    status: null,
                    reason: null,
                    type: null,
                    is_out_of_hours: !!slot.is_out_of_hours,
                    paid_amount: 0,
                    pending_amount: 0,
                    cost: 0,
                    payment_status: null,
                    is_paid: false,
                    rescheduled_from_date: null,
                    created_at: null,
                    confirmed_at: null,
                    arrived_at: null,
                    completed_at: null,
                    paid_at: null,
                    slot_date: dateStr,
                    slot_time: slot.slot_time,
                    slot_status: slot.slot_status
                });
            }
        });

        return resultRows;
    }
}

module.exports = new DailyScheduleService();
