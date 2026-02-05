const { pool } = require('../db');
const googleController = require('../controllers/googleController');

async function run() {
    let conn;
    try {
        conn = await pool.getConnection();
        const txs = await conn.query("SELECT id FROM transactions ORDER BY transaction_date ASC");
        console.log(`Found ${txs.length} transactions to sync.`);

        for (const tx of txs) {
            process.stdout.write(`Syncing tx ${tx.id}... `);
            try {
                await googleController.syncToSpreadsheetHelper(tx.id);
                process.stdout.write(`Done\n`);
            } catch (innerErr) {
                process.stdout.write(`Error: ${innerErr.message}\n`);
            }

            // 6 second delay + cache optimization in controller should prevent quota issues
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
        console.log("Bulk sync completed.");
    } catch (err) {
        console.error("Bulk sync error:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

run();
