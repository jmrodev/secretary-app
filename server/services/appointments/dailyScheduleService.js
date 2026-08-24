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
        const forceAlignment = doc?.force_hour_alignment === 1;

        const schedules = await doctorRepository.getDoctorSchedules(doctorId);

        // 2. Parse Date and Day of Week
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Filter schedules for this specific day of the week
        const dayBlocks = schedules.filter(s => s.day_of_week === dayOfWeek);
        const officialBlocks = dayBlocks.filter(s => !s.is_break);
        const breakBlocks = dayBlocks.filter(s => s.is_break);

        // 3. Query Holiday status and Appointments
        const isHoliday = (await holidayRepository.getHolidaysInRange(dateStr, dateStr)).length > 0;
        const appointments = await appointmentRepository.findDetailedByDoctorAndDate(doctorId, dateStr);

        // 4. Generate Slots
        const slotsMap = new Map();
        const [osh, osm] = overturnStart.split(':').map(Number);
        const [oeh, oem] = overturnEnd.split(':').map(Number);
        let cursorMins = osh * 60 + osm;
        const endMins = oeh * 60 + oem;

        while (cursorMins < endMins) {
            let slotDur = duration;

            if (forceAlignment && (cursorMins % 60) !== 0) {
                slotDur = 60 - (cursorMins % 60);
            } else {
                // Dynamic alignment: check if there's any official work schedule starting in between
                let nextAlignMins = null;
                officialBlocks.forEach(s => {
                    const [sh, sm] = s.start_time.split(':').map(Number);
                    const sMins = sh * 60 + sm;
                    if (sMins > cursorMins && sMins < cursorMins + slotDur) {
                        if (nextAlignMins === null || sMins < nextAlignMins) {
                            nextAlignMins = sMins;
                        }
                    }
                });
                if (nextAlignMins !== null) {
                    slotDur = nextAlignMins - cursorMins;
                }
            }

            if (cursorMins + slotDur > endMins) {
                break;
            }

            const h = Math.floor(cursorMins / 60);
            const m = cursorMins % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

            let status = 'out_of_hours';
            if (isHoliday) {
                status = 'closed_holiday';
            } else {
                const isOfficial = officialBlocks.some(s => timeStr >= s.start_time && timeStr < s.end_time);
                const isBreak = breakBlocks.some(s => s.is_break && timeStr >= s.start_time && timeStr < s.end_time);
                if (isBreak) {
                    status = 'break';
                } else if (isOfficial) {
                    status = 'free';
                }
            }

            slotsMap.set(timeStr, {
                slot_date: dateStr,
                slot_time: timeStr,
                slot_status: status,
                is_out_of_hours: status === 'out_of_hours' ? 1 : 0
            });

            cursorMins += slotDur;
        }

        // 5. Inject off-schedule or arbitrary-time appointments
        appointments.forEach(appt => {
            const apptDateObj = new Date(appt.appointment_date);
            const timeStr = apptDateObj.toLocaleTimeString('en-GB', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }) + ':00';

            if (!slotsMap.has(timeStr)) {
                let status = 'out_of_hours';
                if (isHoliday) {
                    status = 'closed_holiday';
                } else {
                    const isOfficial = officialBlocks.some(s => timeStr >= s.start_time && timeStr < s.end_time);
                    const isBreak = breakBlocks.some(s => s.is_break && timeStr >= s.start_time && timeStr < s.end_time);
                    if (isBreak) {
                        status = 'break';
                    } else if (isOfficial) {
                        status = 'free';
                    }
                }

                slotsMap.set(timeStr, {
                    slot_date: dateStr,
                    slot_time: timeStr,
                    slot_status: status,
                    is_out_of_hours: status === 'out_of_hours' ? 1 : 0
                });
            }
        });

        // 6. In-memory Left Join & Map to final output contract
        const resultRows = [];
        const sortedTimeStrings = Array.from(slotsMap.keys()).sort();

        sortedTimeStrings.forEach(timeStr => {
            const slot = slotsMap.get(timeStr);
            const matchingAppts = appointments.filter(appt => {
                const apptDateObj = new Date(appt.appointment_date);
                const apptTimeStr = apptDateObj.toLocaleTimeString('en-GB', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }) + ':00';
                return apptTimeStr === timeStr;
            });

            if (matchingAppts.length > 0) {
                matchingAppts.forEach(appt => {
                    resultRows.push({
                        id: appt.id,
                        appointment_date: appt.appointment_date,
                        doctor_id: Number(doctorId),
                        doctor_name: appt.doctor_name,
                        patient_id: appt.patient_id,
                        patient_name: appt.patient_name || (appt.reason ? `(Sin Paciente) ${appt.reason}` : 'Desconocido'),
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
                        slot_date: slot.slot_date,
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
                    slot_date: slot.slot_date,
                    slot_time: slot.slot_time,
                    slot_status: slot.slot_status
                });
            }
        });

        return resultRows;
    }
}

module.exports = new DailyScheduleService();
