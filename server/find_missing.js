const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3310,
    connectionLimit: 5
});

async function findMissingTransactions() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Searching for potential unregistered income...");

        // 1. Appointments that should have been paid (status completed/attended/arrived) but have $0 in transactions
        const missingAppts = await conn.query(`
            SELECT a.id, a.appointment_date, a.status, p.full_name as patient, d.full_name as doctor
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.status IN ('completed', 'attended', 'arrived')
            AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.appointment_id = a.id)
            AND a.appointment_date <= NOW()
            ORDER BY a.appointment_date DESC
        `);

        console.log(`\nFound ${missingAppts.length} COMPLETED appointments WITHOUT any translation:`);
        missingAppts.slice(0, 20).forEach(a => {
            console.log(`- [${a.appointment_date.toISOString().split('T')[0]}] ${a.patient} with ${a.doctor} (ID: ${a.id})`);
        });

        // 2. Medical requests (prescriptions, etc) marked as paid but no transaction
        const missingRequests = await conn.query(`
            SELECT r.id, r.created_at, r.type, p.full_name as patient
            FROM medical_requests r
            JOIN patients p ON r.patient_id = p.id
            WHERE r.payment_status = 'paid'
            AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.request_id = r.id)
            LIMIT 20
        `);
        console.log(`\nFound ${missingRequests.length} PAID medical requests WITHOUT any transaction:`);
        missingRequests.forEach(r => {
            console.log(`- [${r.created_at.toISOString().split('T')[0]}] ${r.type} for ${r.patient} (ID: ${r.id})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

findMissingTransactions();
