const httpMocks = require('node-mocks-http');
const { authorize, authorizeCanManageUsers } = require('./authorize');

describe('authorizeCanManageUsers - admin or granted secretary guard', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it('lets an admin through', () => {
        req.user = { user_id: 9, role: 'admin', canManageUsers: true };

        authorizeCanManageUsers(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
    });

    it('lets a secretary with canManageUsers through', () => {
        req.user = { user_id: 2, role: 'secretary', canManageUsers: true };

        authorizeCanManageUsers(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('blocks a secretary without canManageUsers', () => {
        req.user = { user_id: 3, role: 'secretary', canManageUsers: false };

        authorizeCanManageUsers(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
        expect(res._getJSONData()).toEqual({ message: 'Acceso denegado: permisos insuficientes' });
    });

    it('blocks a doctor even when the JWT carries a stale flag', () => {
        req.user = { user_id: 4, role: 'doctor', canManageUsers: true };

        authorizeCanManageUsers(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });
});

describe('authorize - admin-only POST guard', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it('lets an admin through', () => {
        req.user = { role: 'admin' };

        authorize(['admin'])(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('blocks a secretary', () => {
        req.user = { role: 'secretary' };

        authorize(['admin'])(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });
});