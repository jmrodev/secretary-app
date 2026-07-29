/**
 * HolidayService
 * Business logic for holiday management.
 */
class HolidayService {
    constructor(holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    async getHolidays() {
        return await this.holidayRepository.findAll();
    }

    async addHoliday(data) {
        if (!data.date || !data.description) throw new Error("Date and description required");

        try {
            return await this.holidayRepository.create(data);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error("Holiday already exists for this date", { cause: err });
            }
            throw err;
        }
    }

    async deleteHoliday(id) {
        return await this.holidayRepository.delete(id);
    }
}

module.exports = (holidayRepository) => new HolidayService(holidayRepository);
