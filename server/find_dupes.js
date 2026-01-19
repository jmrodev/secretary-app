
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function findMondayDupes() {
    try {
        console.log("Searching for duplicate 'Pending' + 'Paid' transactions on Mondays...");

        // Find appointments that have BOTH a 'pending' transaction AND a 'paid' transaction
        // And are on a Monday (weekday = 0 in some DBs, 1 in others? MySQL: DAYOFWEEK(Sunday)=1, Monday=2)
        const rows = await pool.query(`
            SELECT 
                t_pending.id as pending_tx_id, 
                t_pending.amount as pending_amount, 
                t_paid.id as paid_tx_id, 
                t_paid.amount as paid_amount,
                a.appointment_date, 
                p.full_name
            FROM transactions t_pending
            JOIN transactions t_paid ON t_pending.appointment_id = t_paid.appointment_id
            JOIN appointments a ON t_pending.appointment_id = a.id
            JOIN patients p ON a.patient_id = p.id
            WHERE t_pending.status = 'pending' 
            AND t_paid.status = 'paid'
        `);

        // Note: user said "Mondays". DAYOFWEEK(Mon)=2. 
        // Let's just list ALL duplicates regardless of day first to be safe.
        // Wait, if user said "Mondays", maybe the script generated them on Mondays?

        console.log(`Found ${rows.length} duplicate sets:`);
        rows.forEach(r => {
            console.log(`- Patient: ${r.full_name}, Date: ${new Date(r.appointment_date).toDateString()}, PendingID: ${r.pending_tx_id}, PaidID: ${r.paid_tx_id}`);
        });

        if (rows.length > 0) {
            console.log("\nTo delete the pending ones, run the cleanup.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findMondayDupes();
