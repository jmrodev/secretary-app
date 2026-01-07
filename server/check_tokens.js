
const mariadb = require('mariadb');
require('dotenv').config({ path: './server/.env' });

async function checkTokens() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mariadb.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: 3307
        });

        const rows = await connection.execute("SELECT setting_key, LENGTH(setting_value) as val_len FROM system_settings WHERE setting_key LIKE 'google%'");
        console.log('Google Settings found:', rows);

        // Also check if we have client ID/Secret in env
        console.log('Env Check:', {
            hasClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkTokens();
