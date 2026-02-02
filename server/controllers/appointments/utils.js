const { pool } = require('../../db');
const bcrypt = require('bcrypt');

// Helper to validate Admin Password for overrides
const validateAdminPassword = async (conn, password) => {
    if (!password) return false;
    const adminUser = await conn.query("SELECT password_hash FROM users WHERE username = 'admin'");
    if (adminUser.length === 0) return false;
    return await bcrypt.compare(password, adminUser[0].password_hash);
};

module.exports = {
    validateAdminPassword
};
