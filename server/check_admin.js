const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function checkAdmin() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users WHERE role = 'admin'");
        if (rows.length === 0) {
            console.log("Admin user NOT FOUND.");
            // Create it?
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hashedPassword, 'admin']);
            console.log("Admin user created (admin / admin123)");
        } else {
            console.log("Admin user FOUND:", rows[0].username);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

checkAdmin();
