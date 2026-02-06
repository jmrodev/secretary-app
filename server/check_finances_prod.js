const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3310,
    connectionLimit: 5
});

async function checkIntegrity() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Checking PROD integrity between Appointments and Transactions...");

        // 1. Appointments marked as paid but no PAID transaction
        const ghostPaidAppts = await conn.query(`
            SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, p.full_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE (a.is_paid = 1 OR a.payment_status = 'paid')
            AND NOT EXISTS (
                SELECT 1 FROM transactions t 
                WHERE t.appointment_id = a.id AND t.status = 'paid'
            )
            LIMIT 50
        `);

        console.log(`\n⚠️ Found ${ghostPaidAppts.length} appointments marked as paid but with NO 'paid' transaction:`);
        ghostPaidAppts.forEach(a => console.log(`- Appt ID: ${a.id}, Date: ${a.appointment_date}, Patient: ${a.full_name}`));

        // 2. Completed appointments with NO transaction at all
        const noTxAppts = await conn.query(`
            SELECT a.id, a.appointment_date, p.full_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.status = 'completed'
            AND NOT EXISTS (
                SELECT 1 FROM transactions t WHERE t.appointment_id = a.id
            )
            LIMIT 50
        `);
        console.log(`\n❓ Found ${noTxAppts.length} COMPLETED appointments with NO transactions registered:`);
        noTxAppts.forEach(a => console.log(`- Appt ID: ${a.id}, Date: ${a.appointment_date}, Patient: ${a.full_name}`));

        // 3. Transactions marked as withdrawal - check if they exist
        const withdrawals = await conn.query(`
            SELECT COUNT(*) as count FROM transactions WHERE type = 'withdrawal'
        `);
        console.log(`\n📤 Total withdrawals in system: ${withdrawals[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

checkIntegrity();
