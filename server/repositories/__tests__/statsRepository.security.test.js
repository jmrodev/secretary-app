const statsRepository = require('../statsRepository');
const { pool } = require('../../db');

jest.mock('../../db', () => ({
    pool: {
        query: jest.fn().mockResolvedValue([[]])
    }
}));

describe('StatsRepository Security Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAppointmentSummaryStats SQL Injection', () => {
        it('should throw an error for invalid dateColumn', async () => {
            const maliciousColumn = "appointment_date) = '2023-01-01' OR 1=1; --";
            await expect(statsRepository.getAppointmentSummaryStats(maliciousColumn, '2023-01-01', true, null))
                .rejects.toThrow('Invalid date column');
        });

        it('should work with valid dateColumn', async () => {
            await statsRepository.getAppointmentSummaryStats('appointment_date', '2023-01-01', true, null);
            expect(pool.query).toHaveBeenCalled();
        });
    });

    describe('getRequestAggregates SQL Injection', () => {
        it('should throw an error for invalid dateColumn', async () => {
            const maliciousColumn = "created_at) = '2023-01-01' OR 1=1; --";
            await expect(statsRepository.getRequestAggregates('prescription', maliciousColumn, '2023-01-01', true, null))
                .rejects.toThrow('Invalid date column');
        });

        it('should work with valid dateColumn', async () => {
            await statsRepository.getRequestAggregates('prescription', 'created_at', '2023-01-01', true, null);
            expect(pool.query).toHaveBeenCalled();
        });
    });

    describe('getAllTypesRequestAggregates SQL Injection', () => {
        it('should throw an error for invalid dateColumn', async () => {
            const maliciousColumn = "created_at) = '2023-01-01' OR 1=1; --";
            await expect(statsRepository.getAllTypesRequestAggregates(['prescription'], maliciousColumn, '2023-01-01', true, null))
                .rejects.toThrow('Invalid date column');
        });

        it('should work with valid dateColumn', async () => {
            await statsRepository.getAllTypesRequestAggregates(['prescription'], 'created_at', '2023-01-01', true, null);
            expect(pool.query).toHaveBeenCalled();
        });
    });
});
