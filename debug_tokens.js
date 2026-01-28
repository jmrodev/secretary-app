
const { pool } = require('./server/db');

async function checkTokens() {
    try {
        const patientIds = [5633, 8565];
        console.log(`Checking tokens for IDs: ${patientIds.join(', ')}`);

        for (const id of patientIds) {
            const tokens = await pool.query("SELECT * FROM prescription_request_tokens WHERE patient_id = ?", [id]);
            console.log(`Tokens for patient ${id}:`, tokens);
        }

        // Check if there are any active tokens for this phone number via patient lookup
        const results = await pool.query(`
            SELECT t.*, p.full_name, p.phone 
            FROM prescription_request_tokens t 
            JOIN patients p ON t.patient_id = p.id 
            WHERE p.phone = '+5492494520161'
        `);
        console.log('Tokens found by phone number:', results);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkTokens();
