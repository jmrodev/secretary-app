const holidayRepository = require('../repositories/holidayRepository');

/**
 * HolidayService
 * Business logic for holiday management.
 */
class HolidayService {
    async getHolidays() {
        return await holidayRepository.findAll();
    }

    async addHoliday(data) {
        if (!data.date || !data.description) throw new Error("Date and description required");

        try {
            return await holidayRepository.create(data);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error("Holiday already exists for this date");
            }
            throw err;
        }
    }

    async deleteHoliday(id) {
        return await holidayRepository.delete(id);
    }
}

module.exports = new HolidayService();
