
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function checkActiveAppointments() {
    try {
        console.log("Checking ACTIVE appointments for Victoria Peon...");
        const [rows] = await pool.query(`
            SELECT a.id, a.appointment_date, a.doctor_id, a.status, p.full_name, a.google_event_id, a.payment_status 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE p.full_name LIKE '%Victoria Peon%'
            ORDER BY a.id DESC 
            LIMIT 5
        `);
        console.log("Found Appointments:", rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkActiveAppointments();
