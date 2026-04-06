const insuranceController = require('../../controllers/insuranceController');
const insuranceService = require('../../services/insuranceService');

// Mock the service
jest.mock('../../services/insuranceService');

describe('insuranceController.createInsurance', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                name: 'Test Insurance',
                plan: 'Basic'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        // Suppress console.error in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        console.error.mockRestore();
    });

    it('should successfully create an insurance and return 201', async () => {
        const mockResult = { id: 1, name: 'Test Insurance', plan: 'Basic' };
        insuranceService.createInsurance.mockResolvedValue(mockResult);

        await insuranceController.createInsurance(req, res);

        expect(insuranceService.createInsurance).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors and return 500', async () => {
        const error = new Error('Database connection failed');
        insuranceService.createInsurance.mockRejectedValue(error);

        await insuranceController.createInsurance(req, res);

        expect(insuranceService.createInsurance).toHaveBeenCalledWith(req.body);
        expect(console.error).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Server Error');
    });
});
