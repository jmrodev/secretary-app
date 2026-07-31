const DoctorRepository = require('./doctorRepository');

describe('DoctorRepository - pending_response_template field', () => {
    let mockPool;
    let repo;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        repo = DoctorRepository(mockPool);
        jest.clearAllMocks();
    });

    it('should allow updating pending_response_template (AI pending-state template)', async () => {
        mockPool.query.mockResolvedValue({ affectedRows: 1 });

        const result = await repo.updateById(3, { pending_response_template: 'Tu turno está en revisión.' });

        expect(result).toEqual({ affectedRows: 1 });
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('pending_response_template = ?'),
            ['Tu turno está en revisión.', 3]
        );
    });

    it('should still ignore fields not in ALLOWED_FIELDS', async () => {
        const result = await repo.updateById(3, { not_a_real_column: 'x' });

        expect(result).toBeNull();
        expect(mockPool.query).not.toHaveBeenCalled();
    });
});
