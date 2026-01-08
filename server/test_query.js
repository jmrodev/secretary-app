const mariadb = require('mariadb');

async function testQuery() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: 'cima1255',
            database: 'clinical_management'
        });
        console.log("Connected.");

        const query = `
            SELECT r.*, 
            p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address, p.user_id as patient_user_id, 
            d.full_name as doctor_name, 
            s.username as secretary_name,
            (SELECT method FROM transactions t WHERE t.request_id = r.id AND t.status = 'paid' LIMIT 1) as payment_method
            FROM medical_requests r
            JOIN patients p ON r.patient_id = p.id
            JOIN doctors d ON r.doctor_id = d.id
            LEFT JOIN users s ON r.secretary_id = s.id
            ORDER BY r.created_at DESC
        `;

        const rows = await conn.query(query);
        console.log(`Returned ${rows.length} rows.`);
        if (rows.length > 0) {
            console.log("First row sample:", rows[0]);
        } else {
            console.log("No rows found.");
        }

    } catch (err) {
        console.error("Query Error:", err);
    } finally {
        if (conn) conn.end();
    }
}

testQuery();
