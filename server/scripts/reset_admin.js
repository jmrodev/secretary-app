const { pool } = require('../db');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query("SELECT * FROM users WHERE username = 'admin'");

        if (users.length === 0) {
            console.log("Admin user not found. Creating...");
            const hash = await bcrypt.hash('admin123', 10);
            await conn.query("INSERT INTO users (username, password_hash, role) VALUES ('admin', ?, 'admin')", [hash]);
            console.log("Admin user created.");
        } else {
            console.log("Admin user found. Resetting password...");
            const hash = await bcrypt.hash('admin123', 10);
            await conn.query("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
            console.log("Password reset for admin.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

resetAdmin();
