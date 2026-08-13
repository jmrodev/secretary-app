const userRepository = require('../../repositories/user/userRepository');
const userAccountService = require('../../services/user/UserAccountService');
const { logAction } = require('../../utils/system/audit');
const bcrypt = require('bcrypt');

/**
 * UserAccountController
 * Handles user account management and admin operations.
 */

exports.getUsersForAdmin = async (req, res) => {
    try {
        const users = await userRepository.findAllStaff();
        res.json({ users, totalCount: users.length });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.adminResetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).send("Password required");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userRepository.updatePassword(id, hashedPassword);

        logAction(req, 'ADMIN_RESET_PASSWORD', `Reset password for User ID: ${id}`);
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { adminPassword, ...userData } = req.body;
        if (!adminPassword) {
            return res.status(400).json({ error: "Se requiere su contraseña de administrador para crear un usuario." });
        }

        const adminId = req.user.user_id;
        const adminUser = await userRepository.findById(adminId);
        
        if (!adminUser) return res.status(401).json({ error: "Admin no encontrado." });
        
        const isMatch = await bcrypt.compare(adminPassword, adminUser.password_hash);
        if (!isMatch) {
            return res.status(403).json({ error: "Contraseña de administrador incorrecta." });
        }

        const userId = await userAccountService.createUser(req, userData);
        logAction(req, 'ADMIN_CREATE_USER', `Created user ${userData.username} (${userData.role})`);
        res.status(201).json({ message: "User created", userId });
    } catch (err) {
        console.error("Create User Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        await userAccountService.updateUser(id, req.body);
        logAction(req, 'ADMIN_UPDATE_USER', `Updated user ${id}`);
        res.json({ message: "User updated" });
    } catch (err) {
        console.error("Update User Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPassword } = req.body;
        
        if (!adminPassword) {
            return res.status(400).json({ error: "Se requiere su contraseña de administrador para eliminar un usuario." });
        }

        const adminId = req.user.user_id;
        const adminUser = await userRepository.findById(adminId);
        
        console.log(`[DELETE USER] adminId: ${adminId}, adminUser exists: ${!!adminUser}, role: ${adminUser ? adminUser.role : 'N/A'}`);

        if (!adminUser) return res.status(401).json({ error: "Admin no encontrado." });
        
        const isMatch = await bcrypt.compare(adminPassword, adminUser.password_hash);
        console.log(`[DELETE USER] adminPassword match: ${isMatch} for user ${adminUser.username}`);

        if (!isMatch) {
            return res.status(403).json({ error: "Contraseña de administrador incorrecta." });
        }

        await userAccountService.deleteUser(req, id);
        logAction(req, 'DELETE_USER', `Deleted User ID: ${id}`);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
