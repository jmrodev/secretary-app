const holidayService = require('../../services/appointments/holidayService');
const holidayRepository = require('../../repositories/appointments/holidayRepository');

jest.mock('../../repositories/holidayRepository');
jest.mock('../../db', () => ({
    pool: {
        end: jest.fn(),
        getConnection: jest.fn()
    }
}));

describe('HolidayService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Ensure pool is closed if it was somehow created (which it shouldn't be with the mock)
        const { pool } = require('../../db');
        if (pool && typeof pool.end === 'function') {
            await pool.end();
        }
    });

    describe('getHolidays', () => {
        it('should return a list of holidays', async () => {
            const mockHolidays = [
                { id: 1, date: '2024-01-01', description: 'New Year' },
                { id: 2, date: '2024-12-25', description: 'Christmas' }
            ];
            holidayRepository.findAll.mockResolvedValue(mockHolidays);

            const holidays = await holidayService.getHolidays();

            expect(holidays).toEqual(mockHolidays);
            expect(holidayRepository.findAll).toHaveBeenCalledTimes(1);
        });
    });

    describe('addHoliday', () => {
        it('should create and return a holiday', async () => {
            const holidayData = { date: '2024-05-01', description: 'Labor Day' };
            const createdHoliday = { id: 3, ...holidayData };
            holidayRepository.create.mockResolvedValue(createdHoliday);

            const result = await holidayService.addHoliday(holidayData);

            expect(result).toEqual(createdHoliday);
            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
            expect(holidayRepository.create).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if date is missing', async () => {
            const holidayData = { description: 'No Date Holiday' };

            await expect(holidayService.addHoliday(holidayData))
                .rejects
                .toThrow("Date and description required");

            expect(holidayRepository.create).not.toHaveBeenCalled();
        });

        it('should throw an error if description is missing', async () => {
            const holidayData = { date: '2024-06-01' };

            await expect(holidayService.addHoliday(holidayData))
                .rejects
                .toThrow("Date and description required");

            expect(holidayRepository.create).not.toHaveBeenCalled();
        });

        it('should throw "Holiday already exists for this date" if repository throws ER_DUP_ENTRY', async () => {
            const holidayData = { date: '2024-01-01', description: 'Duplicate Year' };
            const error = new Error('Duplicate entry');
            error.code = 'ER_DUP_ENTRY';
            holidayRepository.create.mockRejectedValue(error);

            await expect(holidayService.addHoliday(holidayData))
                .rejects
                .toThrow("Holiday already exists for this date");

            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
        });

        it('should rethrow other errors from the repository', async () => {
            const holidayData = { date: '2024-01-01', description: 'DB Error' };
            const error = new Error('Database connection lost');
            holidayRepository.create.mockRejectedValue(error);

            await expect(holidayService.addHoliday(holidayData))
                .rejects
                .toThrow("Database connection lost");

            expect(holidayRepository.create).toHaveBeenCalledWith(holidayData);
        });
    });

    describe('deleteHoliday', () => {
        it('should call repository delete and return the result', async () => {
            const holidayId = 1;
            const deleteResult = { affectedRows: 1 };
            holidayRepository.delete.mockResolvedValue(deleteResult);

            const result = await holidayService.deleteHoliday(holidayId);

            expect(result).toEqual(deleteResult);
            expect(holidayRepository.delete).toHaveBeenCalledWith(holidayId);
            expect(holidayRepository.delete).toHaveBeenCalledTimes(1);
        });
    });
});
