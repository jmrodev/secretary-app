const logger = require('../../utils/core/logger');
const googleCalendarService = require('../google/GoogleCalendarService');
const googleIntegrationRepository = require('../../repositories/user/googleIntegrationRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');

/**
 * Process the synchronization queue for Google Calendar.
 * Fetches pending items and retries the operation.
 */
async function processSyncQueue() {
    try {
        // Fetch pending items (limit 10 to avoid overload)
        const pendingItems = await googleIntegrationRepository.findPendingSyncItems(10);

        if (pendingItems.length > 0) {
            logger.info(`[GoogleSync] Processing ${pendingItems.length} pending items...`);
        }

        for (const item of pendingItems) {
            let success = false;
            try {
                if (item.action === 'create') {
                    const eventData = item.payload; // JSON
                    const result = await googleCalendarService.createEventHelper(item.doctor_id, eventData, null); // userId unavailable in background
                    if (result) {
                        // Update appointment with google_event_id
                        await appointmentRepository.update(item.appointment_id, { google_event_id: result.id });
                        success = true;
                    }
                } else if (item.action === 'update') {
                    const { eventId, updates } = item.payload;
                    const result = await googleCalendarService.updateEventHelper(item.doctor_id, eventId, updates, null);
                    if (result) success = true;
                } else if (item.action === 'delete') {
                    const { eventId } = item.payload;
                    // For delete, we assume success if no error, even if 404
                    await googleCalendarService.deleteEventHelper(item.doctor_id, eventId, null);
                    success = true;
                }
            } catch (err) {
                logger.error(`[GoogleSync] Error processing item ${item.id}:`, err.message);
                await googleIntegrationRepository.updateSyncItemError(item.id, err.message);
            }

            if (success) {
                await googleIntegrationRepository.deleteSyncItem(item.id);
                logger.info(`[GoogleSync] Item ${item.id} processed successfully.`);
            }
        }
    } catch (err) {
        logger.error("[GoogleSync] Service Error:", err);
    }
}

// Function to start the worker interval
function startSyncWorker(intervalMs = 300000) { // Default 5 minutes
    logger.info("[GoogleSync] Worker started with interval:", intervalMs);

    // Run immediately on start
    processSyncQueue();

    // Schedule periodic execution
    setInterval(() => {
        processSyncQueue();
    }, intervalMs);
}

module.exports = { startSyncWorker, processSyncQueue };
