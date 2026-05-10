const httpMocks = require('node-mocks-http');
const holidayController = require('../../holidayController');
const holidayService = require('../../../services/appointments/holidayService');

jest.mock('../../services/holidayService');
jest.mock('../../db', () => ({
    pool: {
        end: jest.fn()
    },
    getConnection: jest.fn()
}));

describe('Holiday Controller - getHolidays', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 and a list of holidays on success', async () => {
        const mockHolidays = [
            { id: 1, date: '2023-12-25', description: 'Christmas Day' },
            { id: 2, date: '2024-01-01', description: 'New Year Day' }
        ];

        holidayService.getHolidays.mockResolvedValue(mockHolidays);

        await holidayController.getHolidays(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(mockHolidays);
        expect(holidayService.getHolidays).toHaveBeenCalledTimes(1);
    });

    it('should return 500 and "Server Error" on failure', async () => {
        const mockError = new Error('Database connection failed');
        holidayService.getHolidays.mockRejectedValue(mockError);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await holidayController.getHolidays(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getData()).toBe('Server Error');
        expect(holidayService.getHolidays).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(mockError);

        consoleSpy.mockRestore();
    });
});
