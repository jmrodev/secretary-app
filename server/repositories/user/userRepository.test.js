const UserRepository = require('./userRepository');

describe('UserRepository - can_manage_users permission queries', () => {
    let mockPool;
    let repo;

    beforeEach(() => {
        mockPool = { query: jest.fn() };
        repo = UserRepository(mockPool);
        jest.clearAllMocks();
    });

    describe('findSecretaryPermissions', () => {
        it('queries secretary users joined with their profile name and returns rows', async () => {
            const rows = [
                { id: 2, username: 'sec1', full_name: 'Secretary One', can_manage_users: 1 },
                { id: 3, username: 'sec2', full_name: 'Secretary Two', can_manage_users: 0 }
            ];
            mockPool.query.mockResolvedValue(rows);

            const result = await repo.findSecretaryPermissions();

            expect(mockPool.query).toHaveBeenCalledTimes(1);
            const sql = mockPool.query.mock.calls[0][0];
            expect(sql).toContain('can_manage_users');
            expect(sql).toContain("role = 'secretary'");
            expect(result).toEqual(rows);
        });
    });

    describe('findSecretaryUserIds', () => {
        it('returns only the ids of users with role secretary', async () => {
            mockPool.query.mockResolvedValue([{ id: 2 }, { id: 3 }]);

            const ids = await repo.findSecretaryUserIds();

            expect(mockPool.query).toHaveBeenCalledWith("SELECT id FROM users WHERE role = 'secretary'");
            expect(ids).toEqual([2, 3]);
        });
    });

    describe('updatePassword', () => {
        it('bumps token_version so existing JWTs are evicted on password reset', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            await repo.updatePassword(7, 'hashed-new');

            expect(mockPool.query).toHaveBeenCalledWith(
                "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?",
                ['hashed-new', 7]
            );
        });
    });

    describe('updateCanManageUsers', () => {
        it('updates the flag and bumps token_version using parametrized placeholders', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 2 });

            const result = await repo.updateCanManageUsers([2, 3], true);

            const [sql, params] = mockPool.query.mock.calls[0];
            expect(sql).toContain('can_manage_users');
            expect(sql).toContain('token_version = token_version + 1');
            // ids must be bound as placeholders, never inlined
            expect(sql).toContain('IN (?, ?)');
            expect(params).toEqual([1, 2, 3]);
            expect(result).toEqual({ affectedRows: 2 });
        });

        it('stores false as 0 when revoking permission', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            await repo.updateCanManageUsers([5], false);

            const [sql, params] = mockPool.query.mock.calls[0];
            expect(sql).toContain('IN (?)');
            expect(params).toEqual([0, 5]);
        });
    });
});