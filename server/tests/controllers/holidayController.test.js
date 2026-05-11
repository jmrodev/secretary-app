const holidayController = require('../../controllers/scheduling/holidayController');
const holidayService = require('../../services/appointments/holidayService');

jest.mock('../../services/holidayService');

describe('holidayController', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('addHoliday', () => {
        it('should add a holiday successfully and return 201', async () => {
            req.body = { date: '2023-12-25', description: 'Christmas' };
            holidayService.addHoliday.mockResolvedValue();

            await holidayController.addHoliday(req, res);

            expect(holidayService.addHoliday).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Holiday added" });
        });

        it('should return 409 if holiday already exists for this date', async () => {
            req.body = { date: '2023-12-25', description: 'Christmas' };
            holidayService.addHoliday.mockRejectedValue(new Error("Holiday already exists for this date"));

            await holidayController.addHoliday(req, res);

            expect(holidayService.addHoliday).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith("Holiday already exists for this date");
        });

        it('should return 400 if date and description required error is thrown', async () => {
            req.body = { date: '2023-12-25' };
            holidayService.addHoliday.mockRejectedValue(new Error("Date and description required"));

            await holidayController.addHoliday(req, res);

            expect(holidayService.addHoliday).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Date and description required");
        });

        it('should return 500 for generic server errors', async () => {
            req.body = { date: '2023-12-25', description: 'Christmas' };
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            holidayService.addHoliday.mockRejectedValue(new Error("Database connection failed"));

            await holidayController.addHoliday(req, res);

            expect(holidayService.addHoliday).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Server Error");
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getHolidays', () => {
        it('should return holidays and 200 status', async () => {
            const mockHolidays = [{ id: 1, date: '2023-12-25', description: 'Christmas' }];
            holidayService.getHolidays.mockResolvedValue(mockHolidays);

            await holidayController.getHolidays(req, res);

            expect(holidayService.getHolidays).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockHolidays);
        });

        it('should return 500 for generic server errors', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            holidayService.getHolidays.mockRejectedValue(new Error("Database connection failed"));

            await holidayController.getHolidays(req, res);

            expect(holidayService.getHolidays).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Server Error");
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('deleteHoliday', () => {
        it('should delete a holiday successfully and return 200', async () => {
            req.params.id = '1';
            holidayService.deleteHoliday.mockResolvedValue();

            await holidayController.deleteHoliday(req, res);

            expect(holidayService.deleteHoliday).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith({ message: "Holiday deleted" });
        });

        it('should return 500 for generic server errors', async () => {
            req.params.id = '1';
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            holidayService.deleteHoliday.mockRejectedValue(new Error("Database connection failed"));

            await holidayController.deleteHoliday(req, res);

            expect(holidayService.deleteHoliday).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Server Error");
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
