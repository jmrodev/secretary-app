const { pool } = require('./server/db');
const financeService = require('./server/services/finance/financeService');

async function fixAll() {
    console.log("🚀 Starting Database Integrity Repair...");
    const conn = await pool.getConnection();
    try {
        // 1. Fix Appointments
        const appointments = await conn.query("SELECT id FROM appointments");
        console.log(`Processing ${appointments.length} appointments...`);
        for (const appt of appointments) {
            await financeService.syncAppointmentPaymentStatus(appt.id, 1, conn);
        }

        // 2. Fix Medical Requests
        const requests = await conn.query("SELECT id FROM medical_requests");
        console.log(`Processing ${requests.length} medical requests...`);
        for (const req of requests) {
            await financeService.syncRequestPaymentStatus(req.id, conn);
        }

        console.log("✅ Repair Completed Successfully!");
    } catch (err) {
        console.error("❌ Error during repair:", err);
    } finally {
        conn.release();
        process.exit(0);
    }
}

fixAll();
