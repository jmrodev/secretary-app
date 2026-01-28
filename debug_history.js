
const { pool } = require('./server/db');

async function checkHistory() {
    try {
        const ids = [5633, 8565];
        for (const id of ids) {
            console.log(`\n--- Patient ${id} ---`);
            const [info] = await pool.query("SELECT * FROM patients WHERE id = ?", [id]);
            console.log('Patient Info:', info);

            const prescriptions = await pool.query(`
                SELECT pr.*, a.appointment_date 
                FROM prescriptions pr 
                JOIN appointments a ON pr.appointment_id = a.id 
                WHERE a.patient_id = ?
            `, [id]);
            console.log('Prescriptions:', prescriptions.length);

            const medHistory = await pool.query("SELECT * FROM patient_medications WHERE patient_id = ?", [id]);
            console.log('Medications in list:', medHistory.length);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkHistory();
