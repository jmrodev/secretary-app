const financeService = require('./financeService');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const { pool } = require('../../db');

jest.mock('../../repositories/finance/transactionRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn(),
        query: jest.fn()
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

    it('should create multiple transactions for multiple payment methods and handle debt', async () => {
        const transactionData = {
            doctor_id: 1,
            appointment_id: 44,
            payments: [
                { amount: 1500, method: 'cash' },
                { amount: 2500, method: 'card' }
            ],
            debt_amount: 1000,
            description: 'Pago parcial de consulta compleja'
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

        transactionRepository.callSpCreateTransaction
            .mockResolvedValueOnce(201)
            .mockResolvedValueOnce(202)
            .mockResolvedValueOnce(203);

        const result = await financeService.createTransaction(transactionData, 1);

        expect(transactionRepository.callSpCreateTransaction).toHaveBeenCalledTimes(3);

        expect(transactionRepository.callSpCreateTransaction).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                amount: 1500,
                method: 'cash',
                idempotency_key: expect.stringContaining('_0')
            }),
            mockConnection
        );

        expect(transactionRepository.callSpCreateTransaction).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                amount: 2500,
                method: 'card',
                idempotency_key: expect.stringContaining('_1')
            }),
            mockConnection
        );

        expect(transactionRepository.callSpCreateTransaction).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                amount: 1000,
                status: 'pending',
                idempotency_key: expect.stringContaining('_debt')
            }),
            mockConnection
        );

        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('CALL sp_sync_appointment_payment_status(?)'),
            [44]
        );

        expect(result.id).toBe(202);
    });

    it('should sync request payment status to paid when a paid transaction exists', async () => {
        const transactionData = {
            doctor_id: 1,
            request_id: 55,
            payments: [{ amount: 65000, method: 'cash' }],
            description: 'Pago de licencia'
        };

        mockConnection.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id FROM users')) {
                return Promise.resolve([{ id: 1 }]);
            }
            if (sql.includes('v_medical_request_details')) {
                return Promise.resolve([{ id: 55, payment_status: 'pending', resolved_debt_amount: 65000, paid_amount: 0 }]);
            }
            if (sql.includes("SUM(CASE WHEN status = 'paid'")) {
                return Promise.resolve([{ total_rows: 1, paid_amount: 65000, pending_amount: 0, bonified_count: 0 }]);
            }
            if (sql.includes('UPDATE medical_requests SET payment_status')) {
                return Promise.resolve({ affectedRows: 1 });
            }
            return Promise.resolve([]);
        });

        transactionRepository.callSpCreateTransaction.mockResolvedValue(501);

        const result = await financeService.createTransaction(transactionData, 1);

        expect(result.id).toBe(501);
        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE medical_requests SET payment_status'),
            expect.arrayContaining(['paid', 0, 55])
        );
    });

    it('should sync request payment status to debt when only pending transactions exist', async () => {
        const transactionData = {
            doctor_id: 1,
            request_id: 55,
            payments: [{ amount: 65000, method: 'cash' }],
            description: 'Pago de licencia'
        };

        mockConnection.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id FROM users')) {
                return Promise.resolve([{ id: 1 }]);
            }
            if (sql.includes('v_medical_request_details')) {
                return Promise.resolve([{ id: 55, payment_status: 'pending', resolved_debt_amount: 65000, paid_amount: 0 }]);
            }
            if (sql.includes("SUM(CASE WHEN status = 'paid'")) {
                return Promise.resolve([{ total_rows: 1, paid_amount: 0, pending_amount: 65000, bonified_count: 0 }]);
            }
            if (sql.includes('UPDATE medical_requests SET payment_status')) {
                return Promise.resolve({ affectedRows: 1 });
            }
            return Promise.resolve([]);
        });

        transactionRepository.callSpCreateTransaction.mockResolvedValue(501);

        const result = await financeService.createTransaction(transactionData, 1);

        expect(result.id).toBe(501);
        expect(mockConnection.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE medical_requests SET payment_status'),
            expect.arrayContaining(['debt', 65000, 55])
        );
    });

    it('should sync request payment status via public method using the pool', async () => {
        pool.query
            .mockResolvedValueOnce([{ total_rows: 1, paid_amount: 65000, pending_amount: 0, bonified_count: 0 }])
            .mockResolvedValueOnce({ affectedRows: 1 });

        const newStatus = await financeService.syncRequestPaymentStatus(55);

        expect(newStatus).toBe('paid');
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SUM(CASE WHEN status = 'paid'"),
            [55]
        );
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE medical_requests SET payment_status'),
            expect.arrayContaining(['paid', 0, 55])
        );
    });

    describe('payDebt', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should call proc_pay_patient_debt when patientId is provided', async () => {
            const data = {
                patientId: 10,
                amount: 5000,
                method: 'cash',
                doctor_id: 2
            };

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await financeService.payDebt(data, 1);

            expect(pool.query).toHaveBeenCalledWith(
                "CALL proc_pay_patient_debt(?, ?, ?, ?, ?, ?)",
                [10, 5000, 'cash', 2, 'PAGO_DEUDA', expect.stringContaining('pay_pat_10_')]
            );
            expect(result.amount).toBe(5000);
            expect(result.idempotencyKey).toBeDefined();
        });

        it('should call proc_pay_doctor_debt when doctorId is provided', async () => {
            const data = {
                doctorId: 2,
                amount: 15000,
                method: 'transfer'
            };

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await financeService.payDebt(data, 1);

            expect(pool.query).toHaveBeenCalledWith(
                "CALL proc_pay_doctor_debt(?, ?, ?, ?, ?)",
                [2, 15000, 'transfer', 'PAGO_ALQUILER', expect.stringContaining('pay_doc_2_')]
            );
            expect(result.amount).toBe(15000);
            expect(result.idempotencyKey).toBeDefined();
        });

        it('should throw an error if amount is invalid or zero', async () => {
            await expect(financeService.payDebt({ patientId: 10, amount: -100 }, 1)).rejects.toThrow("Invalid amount");
            await expect(financeService.payDebt({ patientId: 10, amount: 'not_a_number' }, 1)).rejects.toThrow("Invalid amount");
        });

        it('should throw an error if neither patientId nor doctorId is provided', async () => {
            await expect(financeService.payDebt({ amount: 500 }, 1)).rejects.toThrow("Patient ID or Doctor ID is required to pay debt");
        });
    });
});


