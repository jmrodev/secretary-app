const holidayService = require('./holidayService');
const holidayRepository = require('../../repositories/appointments/holidayRepository');

jest.mock('../repositories/holidayRepository');

describe('HolidayService.addHoliday', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a holiday successfully when valid data is provided', async () => {
        const holidayData = { date: '2025-12-25', description: 'Christmas' };
        holidayRepository.create.mockResolvedValue({ insertId: 1 });

        const result = await holidayService.addHoliday(holidayData);

        expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
        expect(result).toEqual({ insertId: 1 });
    });

    it('should throw an error when date is missing', async () => {
        const holidayData = { description: 'Christmas' };

        await expect(holidayService.addHoliday(holidayData)).rejects.toThrow("Date and description required");
    });

    it('should throw an error when description is missing', async () => {
        const holidayData = { date: '2025-12-25' };

        await expect(holidayService.addHoliday(holidayData)).rejects.toThrow("Date and description required");
    });

    it('should throw "Holiday already exists for this date" when repository throws ER_DUP_ENTRY', async () => {
        const holidayData = { date: '2025-12-25', description: 'Christmas' };
        const duplicateError = new Error('Duplicate entry');
        duplicateError.code = 'ER_DUP_ENTRY';
        holidayRepository.create.mockRejectedValue(duplicateError);

        await expect(holidayService.addHoliday(holidayData)).rejects.toThrow("Holiday already exists for this date");
    });

    it('should rethrow generic errors from repository', async () => {
        const holidayData = { date: '2025-12-25', description: 'Christmas' };
        const genericError = new Error('Database connection failed');
        holidayRepository.create.mockRejectedValue(genericError);

        await expect(holidayService.addHoliday(holidayData)).rejects.toThrow('Database connection failed');
    });
});
