const httpMocks = require('node-mocks-http');

jest.mock('../../repositories/user/userRepository', () => {
    const mockRepo = {
        findSecretaryPermissions: jest.fn(),
        findSecretaryUserIds: jest.fn(),
        updateCanManageUsers: jest.fn(),
        findById: jest.fn(),
        updatePassword: jest.fn(),
        findAllStaff: jest.fn()
    };
    // Mirror the real module shape: callable factory with methods attached
    const factory = jest.fn(() => mockRepo);
    return Object.assign(factory, mockRepo);
});
jest.mock('../../services/user/UserAccountService', () => ({
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getSecretaryPermissions: jest.fn(),
    updateSecretaryPermissions: jest.fn(),
    getSecretaryPermissionsById: jest.fn(),
    updateSecretaryPermissionsById: jest.fn(),
    getUsersForAdmin: jest.fn(),
    adminResetPassword: jest.fn()
}));
jest.mock('../../utils/system/audit', () => ({
    logAction: jest.fn()
}));

const userAccountController = require('../user/userAccountController');
const userAccountService = require('../../services/user/UserAccountService');

describe('UserAccountController - secretary permissions', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        jest.clearAllMocks();
    });

    describe('getSecretaryPermissions', () => {
        it('returns 200 with the secretary permission list on success', async () => {
            const secretaries = [
                { id: 2, username: 'sec1', full_name: 'Secretary One', can_manage_users: 1 },
                { id: 3, username: 'sec2', full_name: 'Secretary Two', can_manage_users: 0 }
            ];
            userAccountService.getSecretaryPermissions.mockResolvedValue(secretaries);

            await userAccountController.getSecretaryPermissions(req, res);

            expect(userAccountService.getSecretaryPermissions).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, data: secretaries });
        });

        it('returns 500 on failure', async () => {
            userAccountService.getSecretaryPermissions.mockRejectedValue(new Error('db down'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await userAccountController.getSecretaryPermissions(req, res);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toEqual({ success: false, error: 'Server Error' });
            consoleSpy.mockRestore();
        });
    });

    describe('updateSecretaryPermissions', () => {
        it('delegates the body to the service and returns 200 on success', async () => {
            req.body = { grantToAll: true };
            userAccountService.updateSecretaryPermissions.mockResolvedValue(undefined);

            await userAccountController.updateSecretaryPermissions(req, res);

            expect(userAccountService.updateSecretaryPermissions).toHaveBeenCalledWith({ grantToAll: true });
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, message: 'Permissions updated successfully' });
        });

        it('maps a service 400 error to the response', async () => {
            req.body = {};
            const error = new Error('No secretary ids provided');
            error.statusCode = 400;
            userAccountService.updateSecretaryPermissions.mockRejectedValue(error);

            await userAccountController.updateSecretaryPermissions(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ success: false, error: 'No secretary ids provided' });
        });

        it('returns 500 on unexpected failure', async () => {
            req.body = { secretaryIds: [2] };
            userAccountService.updateSecretaryPermissions.mockRejectedValue(new Error('db down'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await userAccountController.updateSecretaryPermissions(req, res);

            expect(res.statusCode).toBe(500);
            consoleSpy.mockRestore();
        });
    });

    describe('getSecretaryPermissionsById', () => {
        it('returns 200 with the single secretary permissions on success', async () => {
            req.params = { id: '5' };
            const perms = { id: 5, can_crud_appointments: 1, can_crud_finances: 1 };
            userAccountService.getSecretaryPermissionsById.mockResolvedValue(perms);

            await userAccountController.getSecretaryPermissionsById(req, res);

            expect(userAccountService.getSecretaryPermissionsById).toHaveBeenCalledWith('5');
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, data: perms });
        });

        it('returns 404 when secretary is not found', async () => {
            req.params = { id: '999' };
            const error = new Error('Secretaria no encontrada');
            error.statusCode = 404;
            userAccountService.getSecretaryPermissionsById.mockRejectedValue(error);

            await userAccountController.getSecretaryPermissionsById(req, res);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toEqual({ success: false, error: 'Secretaria no encontrada' });
        });
    });

    describe('updateSecretaryPermissionsById', () => {
        it('returns 200 with updated permissions on success', async () => {
            req.params = { id: '5' };
            req.body = { can_crud_appointments: true, can_crud_finances: false };
            const updated = { id: 5, can_crud_appointments: 1, can_crud_finances: 0 };
            userAccountService.updateSecretaryPermissionsById.mockResolvedValue(updated);

            await userAccountController.updateSecretaryPermissionsById(req, res);

            expect(userAccountService.updateSecretaryPermissionsById).toHaveBeenCalledWith('5', req.body);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, message: 'Permissions updated successfully', data: updated });
        });

        it('returns 400 on validation error', async () => {
            req.params = { id: '5' };
            req.body = { can_crud_appointments: 'invalid' };
            const error = new Error("El valor para 'can_crud_appointments' debe ser un booleano.");
            error.statusCode = 400;
            userAccountService.updateSecretaryPermissionsById.mockRejectedValue(error);

            await userAccountController.updateSecretaryPermissionsById(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ success: false, error: error.message });
        });
    });

    describe('getUsersForAdmin', () => {
        it('delegates to the service and returns the staff list', async () => {
            const users = [{ id: 1, username: 'admin' }];
            userAccountService.getUsersForAdmin.mockResolvedValue(users);

            await userAccountController.getUsersForAdmin(req, res);

            expect(userAccountService.getUsersForAdmin).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ users, totalCount: 1 });
        });

        it('returns a JSON 500 on failure', async () => {
            userAccountService.getUsersForAdmin.mockRejectedValue(new Error('db down'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await userAccountController.getUsersForAdmin(req, res);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toEqual({ error: 'Server Error' });
            consoleSpy.mockRestore();
        });
    });

    describe('adminResetPassword', () => {
        it('rejects a missing new password', async () => {
            req.params = { id: '7' };
            req.body = {};

            await userAccountController.adminResetPassword(req, res);

            expect(res.statusCode).toBe(400);
            expect(userAccountService.adminResetPassword).not.toHaveBeenCalled();
        });

        it('delegates id, password and requester to the service', async () => {
            req.params = { id: '7' };
            req.body = { newPassword: 'nueva' };
            req.user = { user_id: 1, role: 'admin' };
            userAccountService.adminResetPassword.mockResolvedValue(undefined);

            await userAccountController.adminResetPassword(req, res);

            expect(userAccountService.adminResetPassword).toHaveBeenCalledWith('7', 'nueva', { user_id: 1, role: 'admin' });
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'Password reset successfully' });
        });

        it('maps a service 403 to the response', async () => {
            req.params = { id: '1' };
            req.body = { newPassword: 'nueva' };
            req.user = { user_id: 4, role: 'secretary' };
            const error = new Error('Solo un administrador puede restablecer la contraseña de otro administrador.');
            error.statusCode = 403;
            userAccountService.adminResetPassword.mockRejectedValue(error);

            await userAccountController.adminResetPassword(req, res);

            expect(res.statusCode).toBe(403);
            expect(res._getJSONData()).toEqual({ error: error.message });
        });
    });

    describe('createUser', () => {
        it('rejects a missing admin password', async () => {
            req.body = { username: 'nuevo', role: 'secretary' };

            await userAccountController.createUser(req, res);

            expect(res.statusCode).toBe(400);
            expect(userAccountService.createUser).not.toHaveBeenCalled();
        });

        it('delegates without the admin password and returns 201', async () => {
            req.user = { user_id: 1 };
            req.body = { adminPassword: 'admin-pass', username: 'nuevo', role: 'secretary' };
            userAccountService.createUser.mockResolvedValue(42);

            await userAccountController.createUser(req, res);

            expect(userAccountService.createUser).toHaveBeenCalledWith(req, { username: 'nuevo', role: 'secretary' });
            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toEqual({ message: 'User created', userId: 42 });
        });

        it('maps a service 403 to the response', async () => {
            req.user = { user_id: 4 };
            req.body = { adminPassword: 'pass', username: 'nuevo', role: 'admin' };
            const error = new Error('Solo un administrador puede crear cuentas de administrador.');
            error.statusCode = 403;
            userAccountService.createUser.mockRejectedValue(error);

            await userAccountController.createUser(req, res);

            expect(res.statusCode).toBe(403);
            expect(res._getJSONData()).toEqual({ error: error.message });
        });
    });

    describe('deleteUser', () => {
        it('rejects a missing admin password', async () => {
            req.params = { id: '7' };
            req.body = {};

            await userAccountController.deleteUser(req, res);

            expect(res.statusCode).toBe(400);
            expect(userAccountService.deleteUser).not.toHaveBeenCalled();
        });

        it('delegates req and id to the service', async () => {
            req.params = { id: '7' };
            req.body = { adminPassword: 'admin-pass' };
            req.user = { user_id: 1 };
            userAccountService.deleteUser.mockResolvedValue(undefined);

            await userAccountController.deleteUser(req, res);

            expect(userAccountService.deleteUser).toHaveBeenCalledWith(req, '7');
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'User deleted successfully' });
        });

        it('maps a service 403 to the response', async () => {
            req.params = { id: '1' };
            req.body = { adminPassword: 'pass' };
            req.user = { user_id: 4 };
            const error = new Error('Solo un administrador puede eliminar cuentas de administrador.');
            error.statusCode = 403;
            userAccountService.deleteUser.mockRejectedValue(error);

            await userAccountController.deleteUser(req, res);

            expect(res.statusCode).toBe(403);
            expect(res._getJSONData()).toEqual({ error: error.message });
        });
    });
});