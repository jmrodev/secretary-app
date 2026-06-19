const httpMocks = require('node-mocks-http');
const mockGetHolidays = jest.fn();

jest.mock('../../services/appointments/holidayService', () => {
    return () => ({
        getHolidays: mockGetHolidays
    });
});
const holidayController = require('../scheduling/holidayController');
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

        mockGetHolidays.mockResolvedValue(mockHolidays);

        await holidayController.getHolidays(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ success: true, data: mockHolidays, error: null });
        expect(mockGetHolidays).toHaveBeenCalledTimes(1);
    });

    it('should return 500 and "Server Error" on failure', async () => {
        const mockError = new Error('Database connection failed');
        mockGetHolidays.mockRejectedValue(mockError);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await holidayController.getHolidays(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ success: false, data: null, error: 'Server Error' });
        expect(mockGetHolidays).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith("[ECC-Controller] getHolidays error:", mockError);

        consoleSpy.mockRestore();
    });
});
