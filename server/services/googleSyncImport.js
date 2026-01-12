const { pool } = require('../db');
const googleController = require('../controllers/googleController');

/**
 * Import events from Google Calendar to local database
 * Prevents duplicates using google_event_id
 */
async function importFromGoogle() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Get all doctors with Google integration
        const doctors = await conn.query("SELECT doctor_id FROM doctor_integrations");

        if (doctors.length === 0) {
            console.log("[GoogleImport] No doctors connected to Google Calendar");
            return;
        }

        let totalImported = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;

        for (const doc of doctors) {
            try {
                const stats = await importDoctorEvents(conn, doc.doctor_id);
                totalImported += stats.imported;
                totalUpdated += stats.updated;
                totalSkipped += stats.skipped;
            } catch (err) {
                console.error(`[GoogleImport] Error importing for doctor ${doc.doctor_id}:`, err.message);
            }
        }

        if (totalImported > 0 || totalUpdated > 0) {
            console.log(`[GoogleImport] Completed: ${totalImported} new, ${totalUpdated} updated, ${totalSkipped} skipped`);
        }

    } catch (err) {
        console.error("[GoogleImport] Service Error:", err);
    } finally {
        if (conn) conn.release();
    }
}

/**
 * Import events for a specific doctor
 */
async function importDoctorEvents(conn, doctorId) {
    const stats = { imported: 0, updated: 0, skipped: 0 };

    // Get tokens for this doctor
    const [integration] = await conn.query(
        "SELECT * FROM doctor_integrations WHERE doctor_id = ?",
        [doctorId]
    );

    if (!integration || !integration.refresh_token) {
        return stats;
    }

    // Get Google Calendar events
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
    );

    oauth2Client.setCredentials({
        refresh_token: integration.refresh_token,
        access_token: integration.access_token,
        expiry_date: integration.token_expiry
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from last 30 days to future
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = response.data.items || [];

    for (const event of events) {
        try {
            // Check if event already exists in DB
            const [existing] = await conn.query(
                "SELECT id, appointment_date, status, payment_status FROM appointments WHERE google_event_id = ?",
                [event.id]
            );

            if (existing) {
                // Event exists, check if needs update
                const eventDate = event.start.dateTime || event.start.date;
                const dbDate = new Date(existing.appointment_date).toISOString();

                if (eventDate !== dbDate) {
                    // Date changed, update
                    await conn.query(
                        "UPDATE appointments SET appointment_date = ? WHERE google_event_id = ?",
                        [new Date(eventDate), event.id]
                    );
                    stats.updated++;
                } else {
                    stats.skipped++;
                }
            } else {
                // New event, import it
                const imported = await importEvent(conn, event, doctorId);
                if (imported) {
                    stats.imported++;
                } else {
                    stats.skipped++;
                }
            }
        } catch (err) {
            console.error(`[GoogleImport] Error processing event ${event.id}:`, err.message);
        }
    }

    return stats;
}

/**
 * Import a single event from Google Calendar
 */
async function importEvent(conn, event, doctorId) {
    // Parse event data
    const summary = event.summary || 'Sin título';
    const description = event.description || '';
    const startTime = event.start.dateTime || event.start.date;

    // Try to parse patient info from description
    const patientInfo = parseEventDescription(description);

    let patientId = null;

    if (patientInfo.patientName) {
        // Try to find patient by name
        const [patient] = await conn.query(
            "SELECT id FROM patients WHERE full_name LIKE ?",
            [`%${patientInfo.patientName}%`]
        );

        if (patient) {
            patientId = patient.id;
        }
    }

    // Skip birthday events
    if (summary.toLowerCase().includes('cumpleaños') || summary.toLowerCase().includes('birthday')) {
        return false;
    }

    // Import all other events (no filter)
    // If no patient found, patient_id will be NULL

    // Insert appointment
    const result = await conn.query(
        `INSERT INTO appointments 
        (patient_id, doctor_id, appointment_date, reason, status, payment_status, google_event_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            patientId,
            doctorId,
            new Date(startTime),
            patientInfo.reason || summary,
            patientInfo.status || 'pending',
            patientInfo.paymentStatus || 'pending',
            event.id
        ]
    );

    console.log(`[GoogleImport] Imported event: ${summary} (ID: ${result.insertId})`);
    return true;
}

/**
 * Parse event description to extract patient info
 * Format: "Motivo: X\nPaciente: Y (DNI: Z)\n..."
 */
function parseEventDescription(description) {
    const info = {
        patientName: null,
        reason: null,
        status: null,
        paymentStatus: null
    };

    if (!description) return info;

    // Extract patient name
    const patientMatch = description.match(/Paciente:\s*([^\(]+)/i);
    if (patientMatch) {
        info.patientName = patientMatch[1].trim();
    }

    // Extract reason
    const reasonMatch = description.match(/Motivo:\s*([^\n]+)/i);
    if (reasonMatch) {
        info.reason = reasonMatch[1].trim();
    }

    // Extract status
    const statusMatch = description.match(/Estado:\s*(\w+)/i);
    if (statusMatch) {
        info.status = statusMatch[1].trim();
    }

    // Extract payment status
    const paymentMatch = description.match(/Pago:\s*(\w+)/i);
    if (paymentMatch) {
        info.paymentStatus = paymentMatch[1].trim();
    }

    return info;
}

module.exports = { importFromGoogle };
