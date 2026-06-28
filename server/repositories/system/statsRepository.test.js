const StatsRepository = require('./statsRepository');

describe('StatsRepository - getAppointmentDebt & getTotalDebt', () => {
    let mockPool;
    let statsRepository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        statsRepository = StatsRepository(mockPool);
        jest.clearAllMocks();
    });

    it('getAppointmentDebt should filter by completed/attended/arrived/absent appointment status', async () => {
        mockPool.query.mockResolvedValue([{ total: 12500.00 }]);

        const result = await statsRepository.getAppointmentDebt(1);

        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("a.status IN ('completed', 'attended', 'arrived', 'absent')"),
            [1]
        );
        expect(result).toBe(12500.00);
    });

    it('getTotalDebt should exclude pending transactions of future appointments', async () => {
        mockPool.query.mockResolvedValue([{ total: 18000.00 }]);

        const result = await statsRepository.getTotalDebt(1);

        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("a.status IN ('completed', 'attended', 'arrived', 'absent')"),
            [1]
        );
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("t.appointment_id IS NULL OR"),
            [1]
        );
        expect(result).toBe(18000.00);
    });
});
