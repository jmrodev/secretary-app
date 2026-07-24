const bcrypt = require('bcrypt');
const { pool } = require('../../db');

async function reset() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        console.log("Hash created:", hash);
        const res = await pool.query("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
        console.log("Update Result:", res);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

reset();
