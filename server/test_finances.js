const { pool } = require('./db');

async function test() {
    try {
        const institutions = await pool.query("SELECT id, name FROM institutions WHERE name LIKE '%Servicio%' OR name LIKE '%local%'");
        if (institutions.length === 0) {
            console.log("No institutions found matching description.");
            return;
        }
        
        const instId = institutions[0].id;
        console.log(`Testing with Institution ID ${instId}: ${institutions[0].name}`);

        const rows = await pool.query(`
            SELECT t.id as transaction_id, t.amount, t.description, t.transaction_date, t.status as payment_status, t.method,
                   p.full_name as patient_name, d.full_name as doctor_name, a.id as appointment_id, a.appointment_date, a.status as appointment_status
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            WHERE t.institution_id = ? ORDER BY t.transaction_date DESC
        `, [instId]);

        for (const r of rows) {
            if (r.patient_name && r.patient_name.includes('Theo')) {
                console.log("\nFound Theo Gatica Row:");
                console.log("-------------------");
                console.log(`payment_status:    "${r.payment_status}" (Type: ${typeof r.payment_status})`);
                console.log(`appointment_id:    "${r.appointment_id}"`);
                console.log(`appointment_status: "${r.appointment_status}" (Type: ${typeof r.appointment_status})`);
                console.log(`appointment_date:   "${r.appointment_date}" (Type: ${typeof r.appointment_date})`);
                console.log(`amount:             "${r.amount}"`);
                
                const isPastPending = r.appointment_status === 'pending' && r.appointment_date && new Date(r.appointment_date) <= new Date();
                const isValidStatus = ['completed', 'attended', 'arrived', 'absent'].includes(r.appointment_status);
                
                console.log("\nMath Eval:");
                console.log(`isPastPending:      ${isPastPending}`);
                console.log(`isValidStatus:      ${isValidStatus}`);
                
                if (r.appointment_date) {
                    const d1 = new Date(r.appointment_date);
                    const d2 = new Date();
                    console.log(`new Date(r.appointment_date): ${d1}`);
                    console.log(`new Date():                  ${d2}`);
                    console.log(`d1 <= d2:                    ${d1 <= d2}`);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

test();
