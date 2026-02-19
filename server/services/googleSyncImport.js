const { pool } = require('../db');
const googleAuthService = require('./google/GoogleAuthService');
const googleIntegrationRepository = require('../repositories/googleIntegrationRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const patientRepository = require('../repositories/patientRepository');
const { google } = require('googleapis');

/**
 * Import events from Google Calendar to local database
 * Prevents duplicates using google_event_id
 */
async function importFromGoogle() {
    let conn;
    try {
        console.log("[GoogleImport] One-way Sync Enabled directly: SKIPPING IMPORT from Google.");
        return; // [DISABLED] One-way Sync

        conn = await pool.getConnection();

        // Get all doctors with Google integration via repository
        const doctors = await googleIntegrationRepository.findAllDoctorIds(conn);

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

    // Get tokens for this doctor via repository
    const integration = await googleIntegrationRepository.findTokensByDoctorId(doctorId, conn);

    if (!integration || !integration.refresh_token) {
        return stats;
    }

    // Get Google Calendar events
    const oauth2Client = await googleAuthService.getAuthorizedClient(doctorId);
    if (!oauth2Client) return stats;

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
            // Check if event already exists in DB via repository
            const existing = await appointmentRepository.findByGoogleEventId(event.id, conn);

            if (existing) {
                // Event exists, check if needs update
                const eventDate = event.start.dateTime || event.start.date;
                const dbDate = new Date(existing.appointment_date).toISOString();

                if (eventDate !== dbDate) {
                    // Date changed, update via repository
                    await appointmentRepository.update(existing.id, { appointment_date: new Date(eventDate) }, conn);
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
        // Try to find patient by name via repository
        const patient = await patientRepository.findByNameLike(patientInfo.patientName, conn);
        if (patient) {
            patientId = patient.id;
        }
    }

    // Skip birthday events
    if (summary.toLowerCase().includes('cumpleaños') || summary.toLowerCase().includes('birthday')) {
        return false;
    }

    // Insert appointment via repository
    const result = await appointmentRepository.create({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: new Date(startTime),
        reason: patientInfo.reason || summary,
        status: patientInfo.status || 'pending',
        payment_status: patientInfo.paymentStatus || 'pending',
        google_event_id: event.id
    }, conn);

    console.log(`[GoogleImport] Imported event: ${summary} (ID: ${result})`);
    return true;
}

/**
 * Parse event description to extract patient info
 */
function parseEventDescription(description) {
    const info = {
        patientName: null,
        reason: null,
        status: null,
        paymentStatus: null
    };

    if (!description) return info;

    const patientMatch = description.match(/Paciente:\s*([^\(]+)/i);
    if (patientMatch) info.patientName = patientMatch[1].trim();

    const reasonMatch = description.match(/Motivo:\s*([^\n]+)/i);
    if (reasonMatch) info.reason = reasonMatch[1].trim();

    const statusMatch = description.match(/Estado:\s*(\w+)/i);
    if (statusMatch) info.status = statusMatch[1].trim();

    const paymentMatch = description.match(/Pago:\s*(\w+)/i);
    if (paymentMatch) info.paymentStatus = paymentMatch[1].trim();

    return info;
}

module.exports = { importFromGoogle };
