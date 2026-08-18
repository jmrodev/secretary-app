const TransactionRepository = require('./transactionRepository');

describe('TransactionRepository - Doctor financial balance and withdrawals', () => {
    let mockPool;
    let repository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn(),
            getConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValue([]),
                release: jest.fn()
            })
        };
        repository = TransactionRepository(mockPool);
        jest.clearAllMocks();
    });

    it('findDailySummary should select from view_daily_balances filtered by doctor_id', async () => {
        mockPool.query.mockResolvedValue([
            { transaction_date: '2026-06-28', doctor_id: 1, cash_balance: 15000, transfer_balance: 20000 }
        ]);

        const result = await repository.findDailySummary(6, 2026, 1);

        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM view_daily_balances WHERE transaction_date BETWEEN ? AND ? AND doctor_id = ?"),
            ['2026-06-01', '2026-06-31', 1]
        );
        expect(result[0].cash_balance).toBe(15000);
    });

    it('findMonthlyWithdrawals should filter transactions by is_withdrawal and doctor_id', async () => {
        mockPool.query.mockResolvedValue([
            { id: 45, is_withdrawal: 1, amount: 8000, doctor_id: 1, method: 'cash' }
        ]);

        const result = await repository.findMonthlyWithdrawals(6, 2026, 1);

        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM transactions WHERE is_withdrawal = 1 AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND doctor_id = ?"),
            [6, 2026, 1]
        );
        expect(result[0].amount).toBe(8000);
    });

    it('findPendingClosures should retrieve daily balances matching doctorClause', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue([
                { date: '2026-06-28', doctor_id: 1, balance: 12000 }
            ]),
            release: jest.fn()
        };
        mockPool.getConnection.mockResolvedValue(mockConn);

        const result = await repository.findPendingClosures(1);

        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT transaction_date as date, doctor_id, doctor_name, cash_balance as balance, transfer_balance as transferBalance"),
            [1]
        );
        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM view_daily_balances WHERE doctor_id = ? ORDER BY date DESC"),
            [1]
        );
        expect(mockConn.release).toHaveBeenCalled();
        expect(result[0].balance).toBe(12000);
    });
});

describe('TransactionRepository - Debt lifecycle helpers (shared conn)', () => {
    let mockPool;
    let repository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn(),
            getConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValue([]),
                release: jest.fn()
            })
        };
        repository = TransactionRepository(mockPool);
        jest.clearAllMocks();
    });

    it('findByAppointmentId should select transactions by appointment_id on the shared conn', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue([
                { id: 10, appointment_id: 7, status: 'pending' }
            ]),
            release: jest.fn()
        };

        const result = await repository.findByAppointmentId(7, mockConn);

        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM transactions WHERE appointment_id = ?"),
            [7]
        );
        expect(mockConn.release).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(10);
    });

    it('findByRequestId should select transactions by request_id on the shared conn', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue([
                { id: 11, request_id: 3, status: 'pending' }
            ]),
            release: jest.fn()
        };

        const result = await repository.findByRequestId(3, mockConn);

        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM transactions WHERE request_id = ?"),
            [3]
        );
        expect(mockConn.release).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].request_id).toBe(3);
    });

    it('detachAndLabel should null FKs, prefix label and guard idempotency with NOT LIKE', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue({ affectedRows: 2 }),
            release: jest.fn()
        };
        const ids = [12, 13];
        const label = 'Deuda (Turno Eliminado)';

        const affected = await repository.detachAndLabel(ids, label, mockConn);

        const [sql, params] = mockConn.query.mock.calls[0];
        expect(sql).toContain("UPDATE transactions");
        expect(sql).toContain("SET appointment_id = NULL, request_id = NULL");
        expect(sql).toContain("description = CONCAT(?, ': ', COALESCE(description, ''))");
        expect(sql).toContain("WHERE id IN (?)");
        expect(sql).toContain("description NOT LIKE CONCAT(?, ':%')");
        expect(params).toEqual([label, ids, label]);
        expect(mockConn.release).not.toHaveBeenCalled();
        expect(affected).toBe(2);
    });

    it('deletePendingByAppointmentId should delete only pending transactions for the appointment', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
            release: jest.fn()
        };

        const affected = await repository.deletePendingByAppointmentId(9, mockConn);

        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'"),
            [9]
        );
        expect(mockConn.release).not.toHaveBeenCalled();
        expect(affected).toBe(1);
    });

    it('deletePendingByRequestId should delete only pending transactions for the request', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
            release: jest.fn()
        };

        const affected = await repository.deletePendingByRequestId(5, mockConn);

        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'"),
            [5]
        );
        expect(mockConn.release).not.toHaveBeenCalled();
        expect(affected).toBe(1);
    });

    it('debt lifecycle helpers should acquire and release their own conn when none is shared', async () => {
        const mockConn = {
            query: jest.fn().mockResolvedValue([]),
            release: jest.fn()
        };
        mockPool.getConnection.mockResolvedValue(mockConn);

        await repository.findByAppointmentId(7);

        expect(mockPool.getConnection).toHaveBeenCalled();
        expect(mockConn.release).toHaveBeenCalled();
    });
});
