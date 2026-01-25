const { pool } = require('../db');
const googleController = require('../controllers/googleController');
const { importFromGoogle } = require('./googleSyncImport');

/**
 * Process the synchronization queue for Google Calendar.
 * Fetches pending items and retries the operation.
 */
async function processSyncQueue() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Fetch pending items (limit 10 to avoid overload)
        const pendingItems = await conn.query("SELECT * FROM google_sync_queue WHERE status = 'pending' AND retries < 5 ORDER BY created_at ASC LIMIT 10");

        if (pendingItems.length > 0) {
            console.log(`[GoogleSync] Processing ${pendingItems.length} pending items...`);
        } else {
            // console.log("[GoogleSync] No pending items."); // Too noisy
        }

        for (const item of pendingItems) {
            let success = false;
            try {
                if (item.action === 'create') {
                    const eventData = item.payload; // JSON
                    const result = await googleController.createEventHelper(item.doctor_id, eventData, null); // userId unavailable in background
                    if (result) {
                        // Update appointment with google_event_id
                        await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, item.appointment_id]);
                        success = true;
                    }
                } else if (item.action === 'update') {
                    const { eventId, updates } = item.payload;
                    const result = await googleController.updateEventHelper(item.doctor_id, eventId, updates, null);
                    if (result) success = true;
                } else if (item.action === 'delete') {
                    const { eventId } = item.payload;
                    // For delete, we assume success if no error, even if 404
                    await googleController.deleteEventHelper(item.doctor_id, eventId, null);
                    success = true;
                }
            } catch (err) {
                console.error(`[GoogleSync] Error processing item ${item.id}:`, err.message);
                await conn.query("UPDATE google_sync_queue SET retries = retries + 1, last_error = ?, updated_at = NOW() WHERE id = ?", [err.message, item.id]);
            }

            if (success) {
                await conn.query("DELETE FROM google_sync_queue WHERE id = ?", [item.id]);
                console.log(`[GoogleSync] Item ${item.id} processed successfully.`);
            }
            // Error case already handled in catch block

        }

    } catch (err) {
        console.error("[GoogleSync] Service Error:", err);
    } finally {
        if (conn) conn.release();
    }
}

// Function to start the worker interval
function startSyncWorker(intervalMs = 300000) { // Default 5 minutes
    console.log("[GoogleSync] Worker started with interval:", intervalMs);

    // Run immediately on start
    processSyncQueue();
    // importFromGoogle(); // [DISABLED] One-way Sync: Do not download from Google

    // Schedule periodic execution
    setInterval(() => {
        processSyncQueue();
        // importFromGoogle(); // [DISABLED] One-way Sync: Do not download from Google
    }, intervalMs);
}

module.exports = { startSyncWorker, processSyncQueue };
