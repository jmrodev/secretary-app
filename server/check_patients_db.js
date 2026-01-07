
const mariadb = require('mariadb');
require('dotenv').config({ path: './server/.env' });

async function checkPatients() {
    let connection;
    try {
        connection = await mariadb.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: 3307
        });
        console.log('DB Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            db: process.env.DB_NAME
        });

        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM patients');
        // MariaDB driver returns BigInt for count, convert to string/number
        const count = countResult.count ? countResult.count : countResult[0].count;
        console.log(`Total patients in DB: ${count}`);

        const rows = await connection.execute('SELECT * FROM patients LIMIT 5');
        // slice to remove meta data if present (mariadb driver returns array with meta property)
        // actually standard array access works
        console.log('Sample patients:', rows.slice(0, 5));

        // Check columns
        const columns = await connection.execute('SHOW COLUMNS FROM patients');
        console.log('Table Columns:', columns.map(c => c.Field));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkPatients();
