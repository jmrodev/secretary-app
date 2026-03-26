const { pool } = require('./db');
(async () => {
    try {
        const rRows = await pool.query(`
            SELECT r.*, p.full_name as patient_name, d.full_name as doctor_name
            FROM medical_requests r
            LEFT JOIN patients p ON r.patient_id = p.id
            LEFT JOIN doctors d ON r.doctor_id = d.id
            WHERE DATE(r.created_at) = CURRENT_DATE()
            OR p.full_name LIKE '%zaffora%'
            OR p.full_name LIKE '%zafora%'
            OR p.full_name LIKE '%emer%'
            ORDER BY r.created_at DESC
        `);
        console.log("=== MEDICAL REQUESTS ===");
        console.log(JSON.stringify(rRows, null, 2));

        const lRows = await pool.query(`
            SELECT * FROM audit_logs
            WHERE action LIKE '%MEDICAL_REQUEST%'
            AND (description LIKE '%zaffora%' OR description LIKE '%zafora%' OR description LIKE '%emer%')
            ORDER BY action_date DESC
        `);
        console.log("=== AUDIT LOGS ===");
        console.log(JSON.stringify(lRows, null, 2));

        const pRows = await pool.query(`
            SELECT id, full_name, user_id FROM patients
            WHERE full_name LIKE '%zaffora%' OR full_name LIKE '%zafora%' OR full_name LIKE '%emer%'
        `);
        console.log("=== PATIENTS ===");
        console.log(JSON.stringify(pRows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
