
const { pool } = require('./server/db');

async function checkPhone() {
    try {
        const phone = '+5492494520161'; // The phone number from the user request
        // Sometimes numbers are stored without +, or with different formatting.
        // I will search with a LIKE to be safe, or just the exact string first.

        console.log(`Searching for phone: ${phone}`);

        const users = await pool.query("SELECT * FROM users WHERE username LIKE '%stella%' OR username LIKE '%ibarra%'");
        console.log('Users matching name:', users);

        const patients = await pool.query("SELECT * FROM patients WHERE phone LIKE ? OR full_name LIKE '%Stella%'", [`%${phone.replace('+', '')}%`]);
        console.log('Patients matching phone or name:', patients);

        // Also check if there is a 'secretary' table or role
        const secretarias = await pool.query("SELECT * FROM users WHERE role = 'secretary'");
        console.log('Secretaries:', secretarias);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkPhone();
