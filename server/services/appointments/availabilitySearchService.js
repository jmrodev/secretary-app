const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const { formatLocalSQL } = require('../../utils/core/dateUtils');

/**
 * AvailabilitySearchService (SQL-First Edition)
 * Minimalistic service layer that delegates slot generation to MariaDB.
 */
class AvailabilitySearchService {
    async getNextFreeSlot({ doctor_id, start_date, include_out_of_hours = 'false' }) {
        const slots = await appointmentRepository.callSpGetFreeSlots({
            doctor_id,
            start_date: formatLocalSQL(start_date || new Date()).split(' ')[0],
            days_to_check: 30,
            include_out_of_hours: include_out_of_hours === 'true' ? 1 : 0
        });

        // Group by date for frontend compatibility
        const grouped = slots.reduce((acc, slot) => {
            const dateStr = slot.date instanceof Date ? slot.date.toISOString().split('T')[0] : String(slot.date).split('T')[0];
            if (!acc[dateStr]) {
                acc[dateStr] = {
                    date: dateStr,
                    dayName: new Date(slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                    slots: []
                };
            }
            acc[dateStr].slots.push({
                time: slot.time,
                iso: slot.iso,
                is_break: slot.is_break === 1,
                is_out_of_hours: slot.is_out_of_hours === 1
            });
            return acc;
        }, {});

        const results = Object.values(grouped);
        const nextStartDate = results.length > 0 ? results[results.length - 1].date : null;

        return { results, nextStartDate };
    }

    // Batch method used by some features (Supports both positional and config object calls)
    async getFreeSlotsBatch(doctorId, startDate, includeOutOfHours) {
        if (doctorId && typeof doctorId === 'object') {
            return this.getNextFreeSlot(doctorId);
        }
        return this.getNextFreeSlot({
            doctor_id: doctorId,
            start_date: startDate,
            include_out_of_hours: includeOutOfHours === true || includeOutOfHours === 'true' ? 'true' : 'false'
        });
    }
}

module.exports = new AvailabilitySearchService();
