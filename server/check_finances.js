const { pool } = require('./db');

async function checkIntegrity() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Checking integrity between Appointments and Transactions...");

        // 1. Appointments marked as paid but no PAID transaction
        const ghostPaidAppts = await conn.query(`
            SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, p.full_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE (a.is_paid = 1 OR a.payment_status = 'paid')
            AND NOT EXISTS (
                SELECT 1 FROM transactions t 
                WHERE t.appointment_id = a.id AND t.status = 'paid'
            )
            LIMIT 100
        `);

        console.log(`\n⚠️ Found ${ghostPaidAppts.length} appointments marked as paid but with NO 'paid' transaction:`);
        ghostPaidAppts.forEach(a => console.log(`- Appt ID: ${a.id}, Date: ${a.appointment_date}, Patient: ${a.full_name}`));

        // 2. Transactions marked as withdrawal but maybe not linked properly? (Withdrawals usually don't link to appointments)

        // 3. Transactions with status 'pending' but appointment is 'completed' (These are debts)
        const pendingDebts = await conn.query(`
            SELECT t.id, t.amount, t.description, a.id as appt_id, p.full_name
            FROM transactions t
            JOIN appointments a ON t.appointment_id = a.id
            JOIN patients p ON a.patient_id = p.id
            WHERE t.status = 'pending' AND a.status = 'completed'
            LIMIT 100
        `);
        console.log(`\nℹ️ Found ${pendingDebts.length} pending debts for completed appointments.`);

        // 4. Check for any "withdrawal" transactions that might be missing a doctor_id
        const invalidWithdrawals = await conn.query(`
            SELECT * FROM transactions WHERE type = 'withdrawal' AND doctor_id IS NULL
        `);
        console.log(`\n❌ Found ${invalidWithdrawals.length} withdrawals MISSING a doctor_id.`);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

checkIntegrity();
