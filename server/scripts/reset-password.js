const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { pool } = require('../db');

async function run() {
    const username = process.argv[2];
    const newPassword = process.argv[3];

    if (!username || !newPassword) {
        console.log('\nUso:');
        console.log('  node server/scripts/reset-password.js <usuario> <nueva_contraseña>\n');
        console.log('Ejemplo:');
        console.log('  node server/scripts/reset-password.js ceci 123456\n');

        try {
            const rows = await pool.query(
                "SELECT id, username, role FROM users WHERE role IN ('admin', 'doctor', 'secretary') ORDER BY role, username"
            );
            console.log('Usuarios del equipo disponibles:');
            console.table(rows);
        } catch (e) {
            console.error('Error listando usuarios:', e.message);
        }
        process.exit(1);
    }

    try {
        const users = await pool.query('SELECT id, username, role FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            console.error(`❌ El usuario "${username}" no existe en la base de datos.`);
            process.exit(1);
        }

        const user = users[0];
        const hash = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);

        console.log(`\n✅ Contraseña actualizada con éxito:`);
        console.log(`   - Usuario: ${user.username} (${user.role})`);
        console.log(`   - Nueva contraseña: ${newPassword}\n`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al actualizar contraseña:', err.message);
        process.exit(1);
    }
}

run();
