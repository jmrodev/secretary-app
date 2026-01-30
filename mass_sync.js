const mysql = require('mysql2/promise');

async function syncAll() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'cima1255',
        database: 'clinical_management'
    });

    try {
        console.log("Starting full synchronization of appointment payment statuses...");

        // Get all appointments from December and January (to be safe)
        const [appts] = await conn.query("SELECT id FROM appointments WHERE appointment_date >= '2025-12-01'");
        console.log(`Analyzing ${appts.length} appointments...`);

        for (const appt of appts) {
            const [txs] = await conn.query("SELECT amount, status FROM transactions WHERE appointment_id = ?", [appt.id]);

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

            const isPaidBit = (finalStatus === 'paid') ? 1 : 0;

            await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [finalStatus, isPaidBit, appt.id]);
        }

        console.log("Sync complete!");
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

syncAll();
