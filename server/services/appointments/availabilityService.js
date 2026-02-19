const availabilitySearchService = require('./availabilitySearchService');
const availabilityStatsService = require('./availabilityStatsService');

/**
 * AvailabilityService (Facade)
 * Orchestrates availability search and stats calculation.
 */
class AvailabilityService {
    async getNextFreeSlot(params) {
        return await availabilitySearchService.getNextFreeSlot(params);
    }

    async getFreeSlotsBatch(doctorId, startDate, includeOutOfHours) {
        return await availabilitySearchService.getFreeSlotsBatch(doctorId, startDate, includeOutOfHours);
    }

    async getCalendarStats(year, month, doctorId) {
        return await availabilityStatsService.getCalendarStats(year, month, doctorId);
    }
}

module.exports = new AvailabilityService();
