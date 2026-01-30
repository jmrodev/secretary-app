const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management'
});

async function checkIntegrity() {
    const [appts] = await pool.query("SELECT id, payment_status, is_paid FROM appointments WHERE appointment_date LIKE '2026-01-%'");

    for (const appt of appts) {
        const [txs] = await pool.query("SELECT amount, status FROM transactions WHERE appointment_id = ?", [appt.id]);

        let totalPaid = 0;
        let totalPending = 0;
        txs.forEach(t => {
            if (t.status === 'paid') totalPaid += Number(t.amount);
            else if (t.status === 'pending') totalPending += Number(t.amount);
        });

        let expectedStatus = 'unpaid';
        if (totalPaid > 0 && totalPending > 0) expectedStatus = 'partial';
        else if (totalPaid > 0 && totalPending === 0) expectedStatus = 'paid';
        else if (totalPaid === 0 && totalPending > 0) expectedStatus = 'debt';

        if (appt.payment_status !== expectedStatus) {
            console.log(`Discrepancy at Appt ${appt.id}: DB says '${appt.payment_status}', Expected '${expectedStatus}' (Paid: ${totalPaid}, Pending: ${totalPending})`);
        }
    }
    process.exit(0);
}

checkIntegrity();
