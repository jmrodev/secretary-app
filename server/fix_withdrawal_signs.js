const mariadb = require('mariadb');
const googleController = require('./controllers/googleController');

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3310,
    connectionLimit: 5
});

async function fixWithdrawals() {
    let conn;
    try {
        console.log("Fixing withdrawal signs in Google Spreadsheet (PROD)...");
        // Using PROD connection settings if possible or just assuming DB_PORT 3310 from env/external
        conn = await pool.getConnection();

        // Find withdrawals from last 7 days to fix
        const withdrawals = await conn.query(`
            SELECT id FROM transactions 
            WHERE (type = 'withdrawal' OR is_withdrawal = 1)
            AND transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        console.log(`Found ${withdrawals.length} withdrawals to re-sync.`);

        for (const w of withdrawals) {
            console.log(`Re-syncing transaction ID: ${w.id}`);
            await googleController.syncToSpreadsheetHelper(w.id, 1); // User ID 1 (Admin)
        }

        console.log("Fix complete!");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

fixWithdrawals();
