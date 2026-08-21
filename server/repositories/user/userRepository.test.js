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

    describe('getSecretaryPermissions', () => {
        it('fetches permissions for a specific secretary by ID', async () => {
            const secRow = {
                id: 5,
                username: 'sec_test',
                role: 'secretary',
                can_manage_users: 1,
                can_crud_appointments: 1,
                can_edit_past_appointments: 0,
                can_crud_requests: 1,
                can_crud_prescriptions: 0,
                can_crud_licenses: 1,
                can_crud_files: 0,
                can_crud_finances: 1
            };
            mockPool.query.mockResolvedValue([secRow]);

            const res = await repo.getSecretaryPermissions(5);

            expect(mockPool.query).toHaveBeenCalledTimes(1);
            const [sql, params] = mockPool.query.mock.calls[0];
            expect(sql).toContain('can_crud_appointments');
            expect(sql).toContain('can_crud_finances');
            expect(sql).toContain("WHERE id = ? AND role = 'secretary'");
            expect(params).toEqual([5]);
            expect(res).toEqual(secRow);
        });

        it('returns null if secretary not found', async () => {
            mockPool.query.mockResolvedValue([]);

            const res = await repo.getSecretaryPermissions(999);

            expect(res).toBeNull();
        });
    });

    describe('updatePermissions', () => {
        it('updates multiple granular permissions and bumps token_version', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const permissions = {
                can_crud_appointments: true,
                can_crud_prescriptions: false,
                can_crud_finances: true
            };

            const result = await repo.updatePermissions(5, permissions);

            expect(result).toBe(true);
            const [sql, params] = mockPool.query.mock.calls[0];
            expect(sql).toContain('can_crud_appointments = ?');
            expect(sql).toContain('can_crud_prescriptions = ?');
            expect(sql).toContain('can_crud_finances = ?');
            expect(sql).toContain('token_version = token_version + 1');
            expect(sql).toContain('WHERE id = ?');
            expect(params).toEqual([1, 0, 1, 5]);
        });

        it('returns false if no valid permission keys are passed', async () => {
            const result = await repo.updatePermissions(5, { invalid_key: true });

            expect(result).toBe(false);
            expect(mockPool.query).not.toHaveBeenCalled();
        });
    });

    describe('findAllStaff', () => {
        it('selects all 8 permission columns in query', async () => {
            mockPool.query.mockResolvedValue([]);

            await repo.findAllStaff();

            const [sql] = mockPool.query.mock.calls[0];
            expect(sql).toContain('can_crud_appointments');
            expect(sql).toContain('can_edit_past_appointments');
            expect(sql).toContain('can_crud_requests');
            expect(sql).toContain('can_crud_prescriptions');
            expect(sql).toContain('can_crud_licenses');
            expect(sql).toContain('can_crud_files');
            expect(sql).toContain('can_crud_finances');
        });
    });
});