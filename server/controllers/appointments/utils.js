const userRepository = require('../../../repositories/user/userRepository');
const bcrypt = require('bcrypt');

// Helper to validate Admin Password for overrides
const validateAdminPassword = async (conn, password) => {
    if (!password) return false;
    const adminUser = await userRepository.findAdminPasswordHash(conn);
    if (!adminUser) return false;
    return await bcrypt.compare(password, adminUser.password_hash);
};

module.exports = { validateAdminPassword };
