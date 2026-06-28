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
