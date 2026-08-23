const userAccountService = require('../../services/user/UserAccountService');
const { logAction } = require('../../utils/system/audit');

/**
 * UserAccountController
 * Handles user account management and admin operations.
 * All business logic (credential re-verification, hashing, multi-table
 * transactions) lives in UserAccountService; this controller only parses
 * requests, delegates, and maps responses.
 */

exports.getUsersForAdmin = async (req, res) => {
    try {
        const users = await userAccountService.getUsersForAdmin(req.user);
        res.json({ users, totalCount: users.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

/**
 * Lists all secretary accounts with their can_manage_users flag.
 * Guarded at route level: admin or secretary with can_manage_users.
 */
exports.getSecretaryPermissions = async (req, res) => {
    try {
        const secretaries = await userAccountService.getSecretaryPermissions();
        res.json({ success: true, data: secretaries });
    } catch (err) {
        console.error("Get Secretary Permissions Error:", err);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

exports.getSecretaryPermissionsById = async (req, res) => {
    try {
        const { id } = req.params;
        const permissions = await userAccountService.getSecretaryPermissionsById(id);
        res.json({ success: true, data: permissions });
    } catch (err) {
        console.error("Get Secretary Permissions By Id Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

exports.updateSecretaryPermissionsById = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await userAccountService.updateSecretaryPermissionsById(id, req.body);
        logAction(req, 'UPDATE_SECRETARY_PERMISSIONS', `Updated permissions for Secretary ID: ${id}`);
        res.json({ success: true, message: "Permissions updated successfully", data: updated });
    } catch (err) {
        console.error("Update Secretary Permissions By Id Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

/**
 * Grants or revokes can_manage_users for targeted secretaries
 * (individual ids or grantToAll). Guarded at route level: strictly admin.
 */
exports.updateSecretaryPermissions = async (req, res) => {
    try {
        await userAccountService.updateSecretaryPermissions(req.body);
        res.json({ success: true, message: "Permissions updated successfully" });
    } catch (err) {
        console.error("Update Secretary Permissions Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

exports.adminResetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).send("Password required");

        await userAccountService.adminResetPassword(id, newPassword, req.user);

        logAction(req, 'ADMIN_RESET_PASSWORD', `Reset password for User ID: ${id}`);
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        res.status(500).json({ error: "Server Error" });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { adminPassword, ...userData } = req.body;
        if (!adminPassword) {
            return res.status(400).json({ error: "Se requiere su contraseña para crear un usuario." });
        }

        const userId = await userAccountService.createUser(req, userData);
        logAction(req, 'ADMIN_CREATE_USER', `Created user ${userData.username} (${userData.role})`);
        res.status(201).json({ message: "User created", userId });
    } catch (err) {
        console.error("Create User Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        res.status(500).json({ error: "Server Error" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        await userAccountService.updateUser(id, req.body, req.user);
        logAction(req, 'ADMIN_UPDATE_USER', `Updated user ${id}`);
        res.json({ message: "User updated" });
    } catch (err) {
        console.error("Update User Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        res.status(500).json({ error: "Server Error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPassword } = req.body;

        if (!adminPassword) {
            return res.status(400).json({ error: "Se requiere su contraseña para eliminar un usuario." });
        }

        await userAccountService.deleteUser(req, id);
        logAction(req, 'DELETE_USER', `Deleted User ID: ${id}`);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete User Error:", err);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        res.status(500).json({ error: "Server Error" });
    }
};