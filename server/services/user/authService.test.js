const jwt = require('jsonwebtoken');

jest.mock('../../db', () => ({
    pool: { query: jest.fn(), getConnection: jest.fn() }
}));
jest.mock('../../utils/system/audit', () => ({
    logAction: jest.fn()
}));

const authService = require('./authService');

describe('AuthService - _generateToken permissions payload', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-key';
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    it('embeds full permissions dictionary and canManageUsers alias for secretary', () => {
        const perms = {
            can_manage_users: true,
            can_crud_appointments: true,
            can_edit_past_appointments: false,
            can_crud_requests: true,
            can_crud_prescriptions: false,
            can_crud_licenses: true,
            can_crud_files: false,
            can_crud_finances: true
        };
        const token = authService._generateToken(1, 'sec1', 'secretary', 5, perms);

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.user_id).toBe(1);
        expect(payload.username).toBe('sec1');
        expect(payload.role).toBe('secretary');
        expect(payload.token_version).toBe(5);
        expect(payload.canManageUsers).toBe(true);
        expect(payload.permissions).toEqual({
            can_manage_users: true,
            can_crud_appointments: true,
            can_edit_past_appointments: false,
            can_crud_requests: true,
            can_crud_prescriptions: false,
            can_crud_licenses: true,
            can_crud_files: false,
            can_crud_finances: true
        });
    });

    it('embeds all false when no permissions are set', () => {
        const token = authService._generateToken(2, 'sec2', 'secretary', 0, {});

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.canManageUsers).toBe(false);
        expect(payload.role).toBe('secretary');
        expect(payload.permissions.can_crud_appointments).toBe(false);
        expect(payload.permissions.can_crud_finances).toBe(false);
    });

    it('handles legacy boolean flag input', () => {
        const token = authService._generateToken(3, 'sec3', 'secretary', 1, true);

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.canManageUsers).toBe(true);
        expect(payload.permissions.can_manage_users).toBe(true);
        expect(payload.permissions.can_crud_appointments).toBe(false);
    });
});

describe('AuthService - register admin-role guard', () => {
    it('rejects a granted secretary creating an admin account', async () => {
        await expect(authService.register(
            { user: { role: 'secretary' } },
            { username: 'nuevo', password: 'pass', role: 'admin', fullName: 'Nuevo Admin' }
        )).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows an admin creating an admin account', async () => {
        const req = { user: { role: 'admin' } };
        const data = { username: 'nuevo', password: 'pass', role: 'admin', fullName: 'Nuevo Admin' };

        const promise = authService.register(req, data);

        // Guard passes; the transaction fails on the unmocked pool — that is fine,
        // we only assert the guard did not reject with 403.
        await expect(promise).rejects.not.toMatchObject({ statusCode: 403 });
    });
});