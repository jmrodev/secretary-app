const { pool } = require('./db');

async function syncAllRequests() {
    let conn;
    try {
        conn = await pool.getConnection();
        const requests = await conn.query("SELECT id, payment_status, status FROM medical_requests");

        console.log(`Checking ${requests.length} requests...`);

        for (const req of requests) {
            const txs = await conn.query("SELECT amount, status FROM transactions WHERE request_id = ?", [req.id]);

            let totalPaid = 0;
            let totalPending = 0;
            txs.forEach(t => {
                if (t.status === 'paid') totalPaid += Number(t.amount);
                else if (t.status === 'pending') totalPending += Number(t.amount);
            });

            let finalStatus = 'pending';
            if (totalPaid > 0 && totalPending > 0) finalStatus = 'partial';
            else if (totalPaid > 0 && totalPending === 0) finalStatus = 'paid';
            else if (totalPaid === 0 && totalPending > 0) finalStatus = 'debt';
            else if (req.payment_status === 'bonified') finalStatus = 'bonified';

            // Special case: if it's completed, has no transactions, and isn't bonified, 
            // it probably should have a debt record if it's not extremely old.
            // But we'll just sync what the transactions say for now.

            if (req.payment_status !== finalStatus || (finalStatus === 'debt' && totalPending > 0)) {
                console.log(`Syncing Request ${req.id}: ${req.payment_status} -> ${finalStatus} (Debt: ${totalPending})`);
                await conn.query("UPDATE medical_requests SET payment_status = ?, debt_amount = ? WHERE id = ?", [finalStatus, totalPending, req.id]);
            }
        }
        console.log("Sync complete.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

syncAllRequests();
