const InstitutionRepository = require('./institutionRepository');

describe('InstitutionRepository - findAll', () => {
    let mockPool;
    let repository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        repository = InstitutionRepository(mockPool);
        jest.clearAllMocks();
    });

    it('should query institutions with total_debt and pending_count calculated based on active/accrued transactions', async () => {
        mockPool.query.mockResolvedValue([
            { id: 1, name: 'OSDE', base_price: 6000.00, total_debt: 12000.00, pending_count: 2 }
        ]);

        const result = await repository.findAll();

        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("total_debt"),
        );
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("pending_count"),
        );
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining("a.status IN ('completed', 'attended', 'arrived', 'absent')"),
        );
        expect(result[0].total_debt).toBe(12000.00);
    });
});
