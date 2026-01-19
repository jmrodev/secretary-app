require('dotenv').config({ path: '../.env' });
const { pool } = require('../db'); // Uses standard db.js, might need env var override for port
const googleController = require('../controllers/googleController');

// FORCE PORT 3307 for Host execution if needed, though usually db.js reads env.
// We will set process.env.DB_PORT before requiring db if strictly necessary, 
// but better to pass it in connection config if pool wasn't created yet?
// Actually db.js creates pool immediately.
// We will rely on running with `DB_PORT=3307 node ...` or setting it here:
process.env.DB_PORT = 3307;

async function repairAppointments() {
    let conn;
    try {
        console.log("🔌 Connecting to Database on Port 3307...");
        conn = await pool.getConnection();
        console.log("✅ Connected.");

        // Fetch Future Appointments
        console.log("🔍 Scanning future appointments...");
        const query = `
            SELECT a.*, 
                   p.full_name, p.dni, p.phone, p.email,
                   d.appointment_duration, d.full_name as doctor_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_date >= DATE(NOW())
            ORDER BY a.appointment_date ASC
        `;

        const appointments = await conn.query(query);
        console.log(`📊 Found ${appointments.length} future appointments.`);

        let stats = {
            googleLinked: 0,
            appOnly: 0,
            repaired: 0,
            failed: 0,
            skipped: 0
        };

        console.log("\n--- PROCESSING APPOINTMENTS ---\n");

        for (const appt of appointments) {
            const dateStr = new Date(appt.appointment_date).toLocaleString();
            const patientName = appt.full_name || "Paciente Eliminado/Desconocido";
            const isLinked = !!appt.google_event_id;

            let statusLabel = isLinked ? "✅ [GOOGLE]" : "⚠️ [APP-ONLY]";

            // Console Row
            console.log(`${statusLabel} ID: ${appt.id} | ${dateStr} | ${patientName} | Dr. ${appt.doctor_name}`);

            if (isLinked) {
                stats.googleLinked++;
                continue;
            }

            stats.appOnly++;

            // --- REPAIR LOGIC ---
            console.log(`   🛠️  Reparing (Syncing to Google)...`);

            try {
                // 1. Prepare Data
                const duration = appt.appointment_duration || 30;
                const startTime = new Date(appt.appointment_date);
                const endTime = new Date(startTime.getTime() + duration * 60000);

                // Handle "No Patient User" (Ghost Patient)
                // If p.full_name is null, we can't get DNI/Phone easily unless stored in 'reason' or we just use defaults.
                let pName = appt.full_name;
                let details = { dni: appt.dni, phone: appt.phone, email: appt.email };

                if (!pName) {
                    // Try to guess from reason if formatted like "Name - Reason"?
                    // Or just label as "Reserva Manual / Paciente Borrado"
                    pName = `(Sin Ficha) ${appt.reason || 'Turno Reservado'}`;
                }

                // Construct Description
                const description = `Motivo: ${appt.reason || 'Consulta'}\n` +
                    `Paciente: ${pName} (DNI: ${details.dni || 'N/A'})\n` +
                    `Teléfono: ${details.phone || 'N/A'}\n` +
                    `Email: ${details.email || 'N/A'}\n` +
                    `Tipo: ${appt.type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\n` +
                    `Estado: ${appt.status}\n` +
                    `Pago: ${appt.payment_status}\n` +
                    `Nota: Sincronizado por Reparador`;

                const eventData = {
                    summary: pName,
                    description: description,
                    start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                    end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                    status: appt.status,
                    paymentStatus: appt.payment_status
                };

                // 2. Create Event via Helper
                // We pass null as userId since this is a script
                const googleEvent = await googleController.createEventHelper(appt.doctor_id, eventData, null);

                if (googleEvent && googleEvent.id) {
                    // 3. Update DB
                    await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [googleEvent.id, appt.id]);
                    console.log(`   ✅ Synced Successfully! Google Event ID: ${googleEvent.id}`);
                    stats.repaired++;
                } else {
                    console.log(`   ❌ Sync Failed: Could not create event (Check Doctor Integration)`);
                    stats.failed++;
                }

            } catch (err) {
                console.error(`   ❌ Error repairing Appt ${appt.id}: ${err.message}`);
                stats.failed++;
            }
        }

        console.log("\n--- SUMMARY ---");
        console.log(`Total Scanned: ${appointments.length}`);
        console.log(`Already Linked: ${stats.googleLinked}`);
        console.log(`App Only (Fixed): ${stats.repaired}`);
        console.log(`Failed/Skipped: ${stats.failed}`);

    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

repairAppointments();
