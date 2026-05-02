const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

async function createAdmin() {
    try {
        console.log(`🚀 Intentando crear/actualizar usuario: ${username}`);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await userRepository.upsert({
            username,
            password_hash: hash,
            role: 'admin'
        });

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
