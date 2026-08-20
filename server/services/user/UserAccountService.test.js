jest.mock('../../db', () => ({
    pool: { query: jest.fn(), getConnection: jest.fn() }
}));
jest.mock('../../repositories/user/userRepository', () => ({
    findSecretaryPermissions: jest.fn(),
    findSecretaryUserIds: jest.fn(),
    updateCanManageUsers: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    findAllStaff: jest.fn(),
    findById: jest.fn()
}));
jest.mock('../../repositories/user/doctorRepository', () => () => ({
    create: jest.fn(), findByUserId: jest.fn(), updateById: jest.fn(), update: jest.fn()
}));
jest.mock('../../repositories/user/patientRepository', () => () => ({
    create: jest.fn(), findByUserId: jest.fn(), update: jest.fn()
}));
jest.mock('../../repositories/user/secretaryRepository', () => () => ({
    create: jest.fn(), findByUserId: jest.fn(), update: jest.fn()
}));
jest.mock('../../repositories/system/phoneRepository', () => () => ({
    syncPhones: jest.fn()
}));
jest.mock('../../utils/system/recycleBin', () => ({
    saveToRecycleBin: jest.fn()
}));
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

const UserAccountService = require('./UserAccountService');
const userRepository = require('../../repositories/user/userRepository');
const bcrypt = require('bcrypt');

describe('UserAccountService - secretary permissions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSecretaryPermissions', () => {
        it('returns the secretary permission list from the repository', async () => {
            const secretaries = [{ id: 2, username: 'sec1', full_name: 'Secretary One', can_manage_users: 1 }];
            userRepository.findSecretaryPermissions.mockResolvedValue(secretaries);

            const result = await UserAccountService.getSecretaryPermissions();

            expect(userRepository.findSecretaryPermissions).toHaveBeenCalledTimes(1);
            expect(result).toEqual(secretaries);
        });
    });

    describe('updateSecretaryPermissions', () => {
        it('grants to every secretary when grantToAll is set', async () => {
            userRepository.findSecretaryUserIds.mockResolvedValue([2, 3]);

            await UserAccountService.updateSecretaryPermissions({ grantToAll: true });

            expect(userRepository.findSecretaryUserIds).toHaveBeenCalledTimes(1);
            expect(userRepository.updateCanManageUsers).toHaveBeenCalledWith([2, 3], true);
        });

        it('grants to the selected secretary ids, dropping non-integer values', async () => {
            await UserAccountService.updateSecretaryPermissions({ secretaryIds: [2, 'abc', 5.5, 7] });

            expect(userRepository.findSecretaryUserIds).not.toHaveBeenCalled();
            expect(userRepository.updateCanManageUsers).toHaveBeenCalledWith([2, 7], true);
        });

        it('revokes when revoke is true', async () => {
            await UserAccountService.updateSecretaryPermissions({ secretaryIds: [2], revoke: true });

            expect(userRepository.updateCanManageUsers).toHaveBeenCalledWith([2], false);
        });

        it('throws a 400 error when no target ids resolve', async () => {
            await expect(UserAccountService.updateSecretaryPermissions({})).rejects.toMatchObject({
                statusCode: 400,
                message: 'No secretary ids provided'
            });
            expect(userRepository.updateCanManageUsers).not.toHaveBeenCalled();
        });
    });

    describe('getUsersForAdmin', () => {
        it('delegates to findAllStaff', async () => {
            const staff = [{ id: 1, username: 'admin' }];
            userRepository.findAllStaff.mockResolvedValue(staff);

            const result = await UserAccountService.getUsersForAdmin();

            expect(userRepository.findAllStaff).toHaveBeenCalledTimes(1);
            expect(result).toEqual(staff);
        });
    });

    describe('adminResetPassword', () => {
        it('hashes the new password and updates it when the requester is an admin', async () => {
            userRepository.findById.mockResolvedValue({ id: 7, role: 'doctor' });
            bcrypt.hash.mockResolvedValue('hashed-new');

            await UserAccountService.adminResetPassword(7, 'nueva', { role: 'admin' });

            expect(bcrypt.hash).toHaveBeenCalledWith('nueva', 10);
            expect(userRepository.updatePassword).toHaveBeenCalledWith(7, 'hashed-new');
        });

        it('allows a secretary to reset a non-admin password', async () => {
            userRepository.findById.mockResolvedValue({ id: 7, role: 'doctor' });
            bcrypt.hash.mockResolvedValue('hashed-new');

            await UserAccountService.adminResetPassword(7, 'nueva', { role: 'secretary' });

            expect(userRepository.updatePassword).toHaveBeenCalledWith(7, 'hashed-new');
        });

        it('rejects a secretary resetting an admin password', async () => {
            userRepository.findById.mockResolvedValue({ id: 1, role: 'admin' });

            await expect(UserAccountService.adminResetPassword(1, 'nueva', { role: 'secretary' }))
                .rejects.toMatchObject({ statusCode: 403 });

            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(userRepository.updatePassword).not.toHaveBeenCalled();
        });
    });

    describe('createUser', () => {
        it('re-verifies the admin credentials before creating', async () => {
            userRepository.findById.mockResolvedValue({ id: 9, role: 'admin', password_hash: 'admin-hash' });
            bcrypt.compare.mockResolvedValue(true);
            const spy = jest.spyOn(UserAccountService, '_createUserTransaction').mockResolvedValue(42);
            const req = { user: { user_id: 9 }, body: { adminPassword: 'admin-pass', username: 'nuevo', role: 'secretary' } };

            const result = await UserAccountService.createUser(req, { username: 'nuevo', role: 'secretary' });

            expect(bcrypt.compare).toHaveBeenCalledWith('admin-pass', 'admin-hash');
            expect(spy).toHaveBeenCalledWith(req, { username: 'nuevo', role: 'secretary' });
            expect(result).toBe(42);
            spy.mockRestore();
        });

        it('rejects wrong admin password', async () => {
            userRepository.findById.mockResolvedValue({ id: 9, role: 'admin', password_hash: 'admin-hash' });
            bcrypt.compare.mockResolvedValue(false);

            await expect(UserAccountService.createUser(
                { user: { user_id: 9 }, body: { adminPassword: 'wrong' } },
                { username: 'nuevo', role: 'secretary' }
            )).rejects.toMatchObject({ statusCode: 403 });

            expect(userRepository.create).not.toHaveBeenCalled();
        });

        it('rejects a non-admin creating an admin account', async () => {
            userRepository.findById.mockResolvedValue({ id: 4, role: 'secretary', password_hash: 'hash' });
            bcrypt.compare.mockResolvedValue(true);

            await expect(UserAccountService.createUser(
                { user: { user_id: 4 }, body: { adminPassword: 'pass' } },
                { username: 'nuevo', role: 'admin' }
            )).rejects.toMatchObject({ statusCode: 403 });

            expect(userRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('deleteUser', () => {
        it('re-verifies the admin credentials before deleting', async () => {
            userRepository.findById.mockResolvedValue({ id: 9, role: 'admin', password_hash: 'admin-hash' });
            bcrypt.compare.mockResolvedValue(true);
            const spy = jest.spyOn(UserAccountService, '_deleteUserTransaction').mockResolvedValue();
            const req = { user: { user_id: 9 }, body: { adminPassword: 'admin-pass' } };

            await UserAccountService.deleteUser(req, 7);

            expect(bcrypt.compare).toHaveBeenCalledWith('admin-pass', 'admin-hash');
            expect(spy).toHaveBeenCalledWith(req, 7);
            spy.mockRestore();
        });

        it('rejects a secretary deleting an admin account', async () => {
            userRepository.findById.mockResolvedValueOnce({ id: 4, role: 'secretary', password_hash: 'hash' })
                .mockResolvedValueOnce({ id: 1, role: 'admin' });
            bcrypt.compare.mockResolvedValue(true);

            await expect(UserAccountService.deleteUser(
                { user: { user_id: 4 }, body: { adminPassword: 'pass' } },
                1
            )).rejects.toMatchObject({ statusCode: 403 });

            expect(userRepository.updatePassword).not.toHaveBeenCalled();
        });
    });
});