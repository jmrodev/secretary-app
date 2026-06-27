const financeService = require('./financeService');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const { pool } = require('../../db');

jest.mock('../../repositories/finance/transactionRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('FinanceService - createTransaction', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: jest.fn()
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        jest.clearAllMocks();
    });

    it('should update existing pending transaction for appointment instead of inserting a new one', async () => {
        const transactionData = {
            doctor_id: 1,
            appointment_id: 42,
            payments: [{ amount: 1000, method: 'card' }],
            description: 'Pago de consulta médica'
        };

        // Mock first query verifying user exists
        mockConnection.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id FROM users')) {
                return Promise.resolve([{ id: 1 }]);
            }
            if (sql.includes('SELECT id FROM transactions WHERE appointment_id = ? AND status = \'pending\'')) {
                return Promise.resolve([{ id: 99 }]); // Pending transaction found with ID 99
            }
            if (sql.includes('UPDATE transactions SET')) {
                return Promise.resolve({ affectedRows: 1 });
            }
            if (sql.includes('sp_sync_appointment_payment_status')) {
                return Promise.resolve();
            }
            return Promise.resolve([]);
        });

        const result = await financeService.createTransaction(transactionData, 1);

        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT id FROM transactions WHERE appointment_id = ? AND status = \'pending\''),
            [42]
        );

        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE transactions SET'),
            expect.arrayContaining([1000, 'card', 'Pago de consulta médica', 99])
        );

        expect(transactionRepository.callSpCreateTransaction).not.toHaveBeenCalled();
        expect(result.id).toBe(99);
    });

    it('should insert a new transaction when no pending transaction exists for the appointment', async () => {
        const transactionData = {
            doctor_id: 1,
            appointment_id: 43,
            payments: [{ amount: 1200, method: 'cash' }],
            description: 'Pago de consulta nueva'
        };

        mockConnection.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id FROM users')) {
                return Promise.resolve([{ id: 1 }]);
            }
            if (sql.includes('SELECT id FROM transactions WHERE appointment_id = ? AND status = \'pending\'')) {
                return Promise.resolve([]); // No pending transactions
            }
            if (sql.includes('sp_sync_appointment_payment_status')) {
                return Promise.resolve();
            }
            return Promise.resolve([]);
        });

        transactionRepository.callSpCreateTransaction.mockResolvedValue(101);

        const result = await financeService.createTransaction(transactionData, 1);

        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT id FROM transactions WHERE appointment_id = ? AND status = \'pending\''),
            [43]
        );

        expect(transactionRepository.callSpCreateTransaction).toHaveBeenCalled();
        expect(result.id).toBe(101);
    });
});
