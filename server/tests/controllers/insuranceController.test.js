const insuranceController = require('../../controllers/insuranceController');
const insuranceService = require('../../services/insuranceService');

// Mock the insuranceService
jest.mock('../../services/insuranceService');

describe('insuranceController', () => {
    let req;
    let res;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup req and res objects
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        // Mock console.error to avoid noise in test output
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('createInsurance', () => {
        it('should call insuranceService.createInsurance and return 201 with the result', async () => {
            const mockInsuranceData = { name: 'Test Insurance', coverage: 'Full' };
            const mockResult = { id: 1, ...mockInsuranceData };

            req.body = mockInsuranceData;
            insuranceService.createInsurance.mockResolvedValue(mockResult);

            await insuranceController.createInsurance(req, res);

            expect(insuranceService.createInsurance).toHaveBeenCalledWith(mockInsuranceData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockResult);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('should handle errors and return 500 status', async () => {
            const mockError = new Error('Database connection failed');
            insuranceService.createInsurance.mockRejectedValue(mockError);

            await insuranceController.createInsurance(req, res);

            expect(insuranceService.createInsurance).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Server Error');
        });
    });
});
