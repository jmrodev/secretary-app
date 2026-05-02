const cron = require('node-cron');
const { executeYearEndReset } = require('./yearEndReset');
const { recordWeeklyStats, recordMonthlyStats } = require('./recordStatistics');

/**
 * Initialize Cron Scheduler
 * Sets up automated tasks for patient statistics tracking
 */
exports.initScheduler = () => {
    // Weekly stats - Every Sunday at 23:55
    cron.schedule('55 23 * * 0', async () => {
        console.log('[Scheduler] Running weekly statistics...');
        try {
            await recordWeeklyStats();
        } catch (err) {
            console.error('[Scheduler] Error in weekly stats:', err);
        }
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    // Monthly stats - Last day of month at 23:55
    cron.schedule('55 23 28-31 * *', async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Only run if tomorrow is the 1st (i.e., today is last day of month)
        if (tomorrow.getDate() === 1) {
            console.log('[Scheduler] Running monthly statistics...');
            try {
                await recordMonthlyStats();
            } catch (err) {
                console.error('[Scheduler] Error in monthly stats:', err);
            }
        }
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    // Yearly reset - December 31 at 23:58
    cron.schedule('58 23 31 12 *', async () => {
        console.log('[Scheduler] Running year-end reset...');
        try {
            await executeYearEndReset();
        } catch (err) {
            console.error('[Scheduler] Error in year-end reset:', err);
        }
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    // Automated WhatsApp Reminders - Every day at 08:30
    cron.schedule('30 8 * * *', async () => {
        console.log('[Scheduler] Running automated WhatsApp reminders...');
        try {
            const { sendAutomatedReminders } = require('../services/whatsappService');
            await sendAutomatedReminders();
        } catch (err) {
            console.error('[Scheduler] Error in automated reminders:', err);
        }
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    console.log('[Scheduler] ✅ Cron jobs initialized (timezone: America/Argentina/Buenos_Aires)');
    console.log('[Scheduler] - Weekly stats: Every Sunday at 23:55');
    console.log('[Scheduler] - Monthly stats: Last day of month at 23:55');
    console.log('[Scheduler] - Year-end reset: December 31 at 23:58');
};
