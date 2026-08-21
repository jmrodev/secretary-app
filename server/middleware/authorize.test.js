const httpMocks = require('node-mocks-http');
const { authorize, authorizePermission, authorizeCanManageUsers } = require('./authorize');

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

describe('authorizePermission - granular secretary permission guard', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it('returns 401 if user is not authenticated', () => {
        authorizePermission('can_crud_licenses')(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
        expect(res._getJSONData()).toEqual({ message: 'No autenticado' });
    });

    it('lets an admin through unconditionally regardless of permission flags', () => {
        req.user = { user_id: 9, role: 'admin', permissions: { can_crud_licenses: false } };

        authorizePermission('can_crud_licenses')(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
    });

    it('lets a secretary through when the permission is true in permissions dictionary', () => {
        req.user = { user_id: 2, role: 'secretary', permissions: { can_crud_licenses: true } };

        authorizePermission('can_crud_licenses')(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('lets a secretary through when the permission is true directly on user object', () => {
        req.user = { user_id: 2, role: 'secretary', can_crud_finances: true };

        authorizePermission('can_crud_finances')(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('blocks a secretary when the permission is false or absent', () => {
        req.user = { user_id: 3, role: 'secretary', permissions: { can_crud_licenses: false } };

        authorizePermission('can_crud_licenses')(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
        expect(res._getJSONData()).toEqual({ message: 'Acceso denegado: permisos insuficientes' });
    });

    it('blocks other roles (e.g. doctor, patient) even if permission flag is set', () => {
        req.user = { user_id: 4, role: 'doctor', permissions: { can_crud_licenses: true } };

        authorizePermission('can_crud_licenses')(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });
});