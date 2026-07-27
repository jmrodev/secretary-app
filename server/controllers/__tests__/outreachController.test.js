const httpMocks = require('node-mocks-http');
const outreachController = require('../communication/outreachController');
const outreachService = require('../../services/communication/outreachService');

jest.mock('../../services/communication/outreachService', () => ({
    getSegmentPatients: jest.fn(),
    sendBroadcast: jest.fn()
}));

jest.mock('../../db', () => ({
    pool: { query: jest.fn(), getConnection: jest.fn() }
}));

describe('OutreachController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSegments', () => {
        it('should return 400 if type query param is missing', async () => {
            req = httpMocks.createRequest({ query: {} });
            res = httpMocks.createResponse();

            await outreachController.getSegments(req, res);

            expect(res.statusCode).toBe(400);
            const data = res._getJSONData();
            expect(data).toHaveProperty('error');
        });

        it('should return 200 with patients array and total count', async () => {
            const mockPatients = [
                { id: 1, full_name: 'John Doe', phone: '5491111111111' },
                { id: 2, full_name: 'Jane Smith', phone: '5492222222222' }
            ];
            outreachService.getSegmentPatients.mockResolvedValue(mockPatients);

            req = httpMocks.createRequest({
                query: { type: 'this_week' }
            });
            res = httpMocks.createResponse();

            await outreachController.getSegments(req, res);

            expect(outreachService.getSegmentPatients).toHaveBeenCalledWith('this_week', undefined, undefined);
            expect(res.statusCode).toBe(200);
            const data = res._getJSONData();
            expect(data).toEqual({ patients: mockPatients, total: 2 });
        });

        it('should pass start_date and end_date to service', async () => {
            outreachService.getSegmentPatients.mockResolvedValue([]);

            req = httpMocks.createRequest({
                query: { type: 'date_range', start_date: '2024-01-01', end_date: '2024-12-31' }
            });
            res = httpMocks.createResponse();

            await outreachController.getSegments(req, res);

            expect(outreachService.getSegmentPatients).toHaveBeenCalledWith('date_range', '2024-01-01', '2024-12-31');
        });

        it('should return 500 on service error', async () => {
            outreachService.getSegmentPatients.mockRejectedValue(new Error('DB error'));

            req = httpMocks.createRequest({ query: { type: 'this_week' } });
            res = httpMocks.createResponse();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await outreachController.getSegments(req, res);

            expect(res.statusCode).toBe(500);
            const data = res._getJSONData();
            expect(data).toHaveProperty('error');
            consoleSpy.mockRestore();
        });
    });

    describe('sendBroadcast', () => {
        it('should return 400 if patient_ids is missing', async () => {
            req = httpMocks.createRequest({
                body: { body: 'Test message', variants: [] }
            });
            res = httpMocks.createResponse();

            await outreachController.sendBroadcast(req, res);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if body is missing', async () => {
            req = httpMocks.createRequest({
                body: { patient_ids: [1, 2], variants: [] }
            });
            res = httpMocks.createResponse();

            await outreachController.sendBroadcast(req, res);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if patient_ids is empty', async () => {
            req = httpMocks.createRequest({
                body: { patient_ids: [], body: 'Test', variants: [] }
            });
            res = httpMocks.createResponse();

            await outreachController.sendBroadcast(req, res);

            expect(res.statusCode).toBe(400);
        });

        it('should call outreachService.sendBroadcast and return result', async () => {
            const mockResult = {
                total_sent: 3,
                total_failed: 0,
                results: [
                    { patient_id: 1, status: 'sent' },
                    { patient_id: 2, status: 'sent' },
                    { patient_id: 3, status: 'sent' }
                ]
            };
            outreachService.sendBroadcast.mockResolvedValue(mockResult);

            req = httpMocks.createRequest({
                body: {
                    patient_ids: [1, 2, 3],
                    body: 'Your appointment is tomorrow',
                    variants: [
                        { header: 'Hi', body: 'Your appointment is tomorrow', footer: 'Thanks' },
                        { header: 'Hello', body: 'Your appointment is tomorrow', footer: 'Regards' }
                    ]
                }
            });
            res = httpMocks.createResponse();

            await outreachController.sendBroadcast(req, res);

            expect(outreachService.sendBroadcast).toHaveBeenCalledWith(
                [1, 2, 3],
                'Your appointment is tomorrow',
                [
                    { header: 'Hi', body: 'Your appointment is tomorrow', footer: 'Thanks' },
                    { header: 'Hello', body: 'Your appointment is tomorrow', footer: 'Regards' }
                ]
            );
            expect(res.statusCode).toBe(200);
            const data = res._getJSONData();
            expect(data.total_sent).toBe(3);
        });

        it('should return 500 on service error', async () => {
            outreachService.sendBroadcast.mockRejectedValue(new Error('Send failed'));

            req = httpMocks.createRequest({
                body: { patient_ids: [1], body: 'Test', variants: [] }
            });
            res = httpMocks.createResponse();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await outreachController.sendBroadcast(req, res);

            expect(res.statusCode).toBe(500);
            const data = res._getJSONData();
            expect(data).toHaveProperty('error');
            consoleSpy.mockRestore();
        });
    });
});
