const jwt = require('jsonwebtoken');

jest.mock('../../db', () => ({
    pool: { query: jest.fn(), getConnection: jest.fn() }
}));
jest.mock('../../utils/system/audit', () => ({
    logAction: jest.fn()
}));

const authService = require('./authService');

describe('AuthService - _generateToken canManageUsers payload', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-key';
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    it('embeds canManageUsers: true for a granted secretary', () => {
        const token = authService._generateToken(1, 'sec1', 'secretary', 5, true);

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.user_id).toBe(1);
        expect(payload.username).toBe('sec1');
        expect(payload.role).toBe('secretary');
        expect(payload.token_version).toBe(5);
        expect(payload.canManageUsers).toBe(true);
    });

    it('embeds canManageUsers: false when the flag is not set', () => {
        const token = authService._generateToken(2, 'sec2', 'secretary', 0, false);

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.canManageUsers).toBe(false);
        expect(payload.role).toBe('secretary');
    });

    it('defaults to false when the flag argument is omitted (legacy callers)', () => {
        const token = authService._generateToken(9, 'admin', 'admin', 2);

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        expect(payload.canManageUsers).toBe(false);
        expect(payload.role).toBe('admin');
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