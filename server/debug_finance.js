
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function checkTransactions() {
    try {
        console.log("Checking transactions for Juana Santillan...");
        // Find patient id first just in case
        const [p] = await pool.query("SELECT id, user_id FROM patients WHERE full_name LIKE '%Juana Santillan%'");
        if (!p) { console.log("Patient not found"); process.exit(0); }

        const rows = await pool.query(`
            SELECT id, type, amount, description, status, transaction_date, appointment_id 
            FROM transactions 
            WHERE related_user_id = ? 
            ORDER BY id DESC 
            LIMIT 5
        `, [p.user_id]);

        console.log("Transactions:", rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTransactions();
