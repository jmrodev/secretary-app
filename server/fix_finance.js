
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function fixFinance() {
    try {
        console.log("Deleting duplicate pending transaction (ID 90)...");
        const res = await pool.query("DELETE FROM transactions WHERE id = 90");
        console.log(`Deleted ${res.affectedRows} rows.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixFinance();
