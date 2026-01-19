const { createAppointment } = require('./controllers/appointmentController');
const { pool } = require('./db');

async function runTest() {
    const req = {
        body: {
            doctor_id: 10,
            patient_id: 8568,
            appointment_date: '2026-06-01T11:00:00-03:00', // As requested: 6/1/2026 11am
            reason: 'Test Split Payment (Theo/Servicio Local)',
            type: 'consultation'
        },
        user: {
            role: 'secretary',
            user_id: 1 // Assuming admin/secretary ID
        },
        ip: '127.0.0.1'
    };

    const res = {
        status: (code) => ({
            send: (msg) => console.log(`STATUS ${code}:`, msg),
            json: (data) => console.log(`STATUS ${code} JSON:`, data)
        }),
        json: (data) => console.log("JSON:", data)
    };

    console.log("Running Create Appointment Test...");
    try {
        await createAppointment(req, res);
    } catch (e) {
        console.error("Test Error:", e);
    }

    // Wait and check transactions
    setTimeout(async () => {
        try {
            const rows = await pool.query("SELECT * FROM transactions WHERE appointment_id = (SELECT id FROM appointments ORDER BY id DESC LIMIT 1)");
            console.log("--- Transactions Created ---");
            console.log(rows);
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }, 2000);
}

runTest();
