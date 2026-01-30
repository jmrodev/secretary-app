const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management'
});

async function testReport() {
    const targetMonth = 1;
    const targetYear = 2026;

    const query = `
        SELECT 
            a.id,
            a.appointment_date,
            a.status as attendance,
            a.payment_status,
            a.reason,
            a.type as appointment_type,
            p.full_name as patient_name,
            COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as paid_amount,
            GROUP_CONCAT(DISTINCT t.method SEPARATOR ', ') as payment_methods
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN transactions t ON a.id = t.appointment_id
        WHERE MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?
        GROUP BY a.id, a.appointment_date, a.status, a.payment_status, a.reason, a.type, p.full_name
        ORDER BY a.appointment_date ASC
    `;

    const [rows] = await pool.query(query, [targetMonth, targetYear]);

    const salusso = rows.find(r => r.patient_name && r.patient_name.includes('Salusso'));
    console.log('Salusso Report Entry:', JSON.stringify(salusso, null, 2));

    // Find all 'debt' entries with paid_amount > 0
    const anomalies = rows.filter(r => r.payment_status === 'debt' && Number(r.paid_amount) > 0);
    console.log('Anomalies (Debt but Paid > 0):', anomalies.length);
    if (anomalies.length > 0) console.log(anomalies);

    process.exit(0);
}

testReport();
