const holidayRepository = require('../../../repositories/appointments/holidayRepository');
const doctorRepository = require('../../../repositories/user/doctorRepository');
const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');

/**
 * AvailabilityStatsService
 * Handles calculation of calendar statistics (free/booked slots).
 */
class AvailabilityStatsService {
    async getCalendarStats(year, month, doctor_id) {
        const doc = await doctorRepository.getDoctorConfig(doctor_id);
        const duration = doc?.appointment_duration || 60;
        const overturnStart = doc?.overturn_start_time || '08:00:00';
        const overturnEnd = doc?.overturn_end_time || '21:00:00';
        const forceAlignment = doc?.force_hour_alignment === 1;

        const schedules = await doctorRepository.getDoctorSchedules(doctor_id);

        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const holidaysAll = await holidayRepository.getHolidaysInRange(startDate, endDate);
        const holidays = new Set(holidaysAll);

        const appts = await appointmentRepository.findInRange(doctor_id, startDate + ' 00:00:00', endDate + ' 23:59:59', ['cancelled', 'absent', 'suspended', 'rejected']);

        const stats = {};
        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentObj = new Date(year, month - 1, d);
            const dayOfWeek = currentObj.getDay();

            if (holidays.has(dateStr)) {
                stats[dateStr] = { freeIn: 0, freeOut: 0, totalIn: 0, totalOut: 0, bookedIn: 0, bookedOut: 0, isHoliday: true };
                continue;
            }

            let capacityIn = 0;
            let capacityOut = 0;

            const dayBlocks = schedules.filter(s => s.day_of_week === dayOfWeek);
            const officialBlocks = dayBlocks.filter(s => !s.is_break);

            const [osh, osm] = overturnStart.split(':');
            const [oeh, oem] = overturnEnd.split(':');
            let cursorMins = parseInt(osh) * 60 + parseInt(osm);
            const endMins = parseInt(oeh) * 60 + parseInt(oem);

            while (cursorMins < endMins) {
                let slotDur = duration;
                if (forceAlignment && (cursorMins % 60) !== 0) {
                    slotDur = 60 - (cursorMins % 60);
                }
                if (cursorMins + slotDur > endMins) break;

                const h = Math.floor(cursorMins / 60);
                const m = cursorMins % 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

                const isOfficial = officialBlocks.some(s => timeStr >= s.start_time && timeStr < s.end_time);
                const isBreak = dayBlocks.some(s => s.is_break && timeStr >= s.start_time && timeStr < s.end_time);

                if (isOfficial) {
                    capacityIn++;
                } else if (!isBreak) {
                    capacityOut++;
                }
                cursorMins += slotDur;
            }

            const dailyAppts = appts.filter(a => {
                const aD = new Date(a.appointment_date);
                const ds = aD.toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
                return ds === dateStr;
            });

            let bookedIn = 0;
            let bookedOut = 0;

            dailyAppts.forEach(a => {
                const apptDate = new Date(a.appointment_date);
                const apptTimeStr = apptDate.toLocaleTimeString('en-GB', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }) + ':00';

                const isExplicitExtra = (a.is_out_of_hours === 1 || a.is_out_of_hours === true || String(a.is_out_of_hours) === 'true');
                const fallsInOfficial = officialBlocks.some(s => {
                    const sStart = String(s.start_time).substring(0, 5) + ':00';
                    const sEnd = String(s.end_time).substring(0, 5) + ':00';
                    return apptTimeStr >= sStart && apptTimeStr < sEnd;
                });

                if (!isExplicitExtra && fallsInOfficial) {
                    bookedIn++;
                } else {
                    bookedOut++;
                }
            });

            stats[dateStr] = {
                freeIn: Math.max(0, capacityIn - bookedIn),
                freeOut: Math.max(0, capacityOut - bookedOut),
                totalIn: capacityIn,
                totalOut: capacityOut,
                bookedIn,
                bookedOut,
                isHoliday: false
            };
        }
        return stats;
    }
}

module.exports = new AvailabilityStatsService();
