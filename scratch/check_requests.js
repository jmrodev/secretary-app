const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'cima1255',
  database: 'clinical_management',
  port: 3307,
  connectionLimit: 1
});

(async () => {
    try {
        const rowsCount = await pool.query("SELECT COUNT(*) as total FROM medical_requests");
        console.log("TOTAL MEDICAL REQUESTS:", rowsCount[0].total);
        
        const rows = await pool.query("SELECT r.id, r.status, r.type, p.full_name as patient, d.full_name as doctor FROM medical_requests r LEFT JOIN patients p ON r.patient_id = p.id LEFT JOIN doctors d ON r.doctor_id = d.id LIMIT 10");
        console.log("FIRST 10 REQUESTS:", JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("DB ERROR:", err);
    } finally {
        process.exit();
    }
})();
