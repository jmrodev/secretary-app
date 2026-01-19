require('dotenv').config({ path: '../.env' }); // Adjust path to .env if needed
const { pool } = require('../db');
const googleController = require('../controllers/googleController');

/**
 * Script to sync existing future appointments to Google Calendar
 * avoiding the need to delete and recreate them.
 */
async function syncMissingToGoogle() {
    let conn;
    try {
        console.log("Connecting to database...");
        conn = await pool.getConnection();

        // 1. Find future appointments without google_event_id
        // We only care about pending/confirmed/rescheduled/debt
        const query = `
            SELECT a.*, d.appointment_duration, 
                   p.full_name, p.dni, p.phone, p.email,
                   doc.id as doctor_id_real
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors doc ON a.doctor_id = doc.id
            WHERE a.appointment_date >= NOW() 
              AND (a.google_event_id IS NULL OR a.google_event_id = '')
              AND a.status IN ('pending', 'confirmed', 'rescheduled', 'debt')
            ORDER BY a.appointment_date ASC
        `;

        const appointments = await conn.query(query);

        if (appointments.length === 0) {
            console.log("No missing appointments found to sync.");
            return;
        }

        console.log(`Found ${appointments.length} appointments to sync...`);

        for (const appt of appointments) {
            try {
                // Prepare Google Payload
                const startTime = new Date(appt.appointment_date);
                const duration = appt.appointment_duration || 30;
                const endTime = new Date(startTime.getTime() + duration * 60000);

                const pNameStr = appt.full_name || 'Unknown';
                const description = `Motivo: ${appt.reason || 'Consulta'}\nPaciente: ${pNameStr} (DNI: ${appt.dni || 'N/A'})\nTeléfono: ${appt.phone || 'N/A'}\nEmail: ${appt.email || 'N/A'}\nTipo: ${appt.type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\nEstado: ${appt.status}\nPago: ${appt.payment_status}\nCreado por Aplicación de Secretaría (Sincronización Automática)`;

                const eventData = {
                    summary: pNameStr,
                    description: description,
                    start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                    end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                    status: appt.status, // Helper might use this for color
                    paymentStatus: appt.payment_status // Helper might use this for color
                };

                console.log(`Syncing Appt ID ${appt.id} for ${pNameStr} at ${startTime.toLocaleString()}...`);

                // Use Helper
                const googleEvent = await googleController.createEventHelper(appt.doctor_id, eventData, null);

                if (googleEvent && googleEvent.id) {
                    await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [googleEvent.id, appt.id]);
                    console.log(`✅ Success! Linked Google Event ID: ${googleEvent.id}`);
                } else {
                    console.warn(`⚠️ Skipped: Doctor ${appt.doctor_id} might not be connected to Google.`);
                }

            } catch (innerErr) {
                console.error(`❌ Failed to sync Appt ID ${appt.id}:`, innerErr.message);
            }
        }

        console.log("Sync process completed.");

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

syncMissingToGoogle();
