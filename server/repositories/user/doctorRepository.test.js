const DoctorRepository = require('./doctorRepository');

describe('DoctorRepository - ALLOWED_FIELDS filtering', () => {
    let mockPool;
    let repo;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        repo = DoctorRepository(mockPool);
        jest.clearAllMocks();
    });

    it('should still ignore fields not in ALLOWED_FIELDS', async () => {
        const result = await repo.updateById(3, { not_a_real_column: 'x' });

        expect(result).toBeNull();
        expect(mockPool.query).not.toHaveBeenCalled();
    });
});
