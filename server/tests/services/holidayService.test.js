const holidayService = require('../../services/holidayService');
const holidayRepository = require('../../repositories/holidayRepository');

jest.mock('../../repositories/holidayRepository');

describe('HolidayService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addHoliday', () => {
        it('should create a holiday successfully when valid data is provided', async () => {
            const holidayData = { date: '2024-01-01', description: 'New Year' };
            const createdHoliday = { id: 1, ...holidayData };

            holidayRepository.create.mockResolvedValue(createdHoliday);

            const result = await holidayService.addHoliday(holidayData);

            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
            expect(result).toEqual(createdHoliday);
        });

        it('should throw an error when date is missing', async () => {
            const invalidData = { description: 'Missing date' };

            await expect(holidayService.addHoliday(invalidData)).rejects.toThrow("Date and description required");
            expect(holidayRepository.create).not.toHaveBeenCalled();
        });

        it('should throw an error when description is missing', async () => {
            const invalidData = { date: '2024-01-01' };

            await expect(holidayService.addHoliday(invalidData)).rejects.toThrow("Date and description required");
            expect(holidayRepository.create).not.toHaveBeenCalled();
        });

        it('should throw a specific error when a duplicate entry error occurs', async () => {
            const holidayData = { date: '2024-01-01', description: 'New Year' };
            const duplicateError = new Error('Duplicate entry');
            duplicateError.code = 'ER_DUP_ENTRY';

            holidayRepository.create.mockRejectedValue(duplicateError);

            await expect(holidayService.addHoliday(holidayData)).rejects.toThrow("Holiday already exists for this date");
            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
        });

        it('should throw the original error if it is not a duplicate entry error', async () => {
            const holidayData = { date: '2024-01-01', description: 'New Year' };
            const someOtherError = new Error('Database connection failed');

            holidayRepository.create.mockRejectedValue(someOtherError);

            await expect(holidayService.addHoliday(holidayData)).rejects.toThrow(someOtherError);
            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
        });
    });
});
