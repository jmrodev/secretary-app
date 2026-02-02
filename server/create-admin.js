const bcrypt = require('bcrypt');
const { pool } = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

async function createAdmin() {
    try {
        console.log(`🚀 Intentando crear/actualizar usuario: ${username}`);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, "admin") ON DUPLICATE KEY UPDATE password_hash = ?',
            [username, hash, hash]
        );

        console.log('✅ Usuario administrativo listo.');
        console.log(`👤 Usuario: ${username}`);
        console.log(`🔑 Contraseña: ${password}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
