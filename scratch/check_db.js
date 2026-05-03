require('dotenv').config({ path: './server/.env' });
const { pool } = require('../server/db');

async function checkData() {
    try {
        const [requests] = await pool.query("SELECT id, doctor_id, status, type FROM medical_requests LIMIT 5");
        console.log("Sample Requests:", requests);
        
        const [counts] = await pool.query("SELECT status, count(*) as total FROM medical_requests GROUP BY status");
        console.log("Status Counts:", counts);
        
        const [doctorCounts] = await pool.query("SELECT doctor_id, count(*) as total FROM medical_requests GROUP BY doctor_id");
        console.log("Doctor Counts:", doctorCounts);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
