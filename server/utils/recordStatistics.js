const { pool } = require('../db');

/**
 * Record Weekly Statistics
 * Runs every Sunday at 23:55
 * Records the count of new patients for the current week
 */
exports.recordWeeklyStats = async () => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Get current week's start/end (Sunday to Saturday)
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Sunday
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Count new patients created this week
        const [count] = await conn.query(
            `SELECT COUNT(*) as total FROM patients 
             WHERE is_new_patient = 1 
             AND marked_new_at >= ? AND marked_new_at <= ?`,
            [weekStart, weekEnd]
        );

        await conn.query(
            `INSERT INTO patient_statistics 
             (period_type, period_start, period_end, new_patients_count) 
             VALUES ('weekly', ?, ?, ?)
             ON DUPLICATE KEY UPDATE new_patients_count = ?`,
            [
                weekStart.toISOString().split('T')[0],
                weekEnd.toISOString().split('T')[0],
                count[0].total,
                count[0].total
            ]
        );

        console.log(`[WeeklyStats] Recorded ${count[0].total} new patients for week starting ${weekStart.toISOString().split('T')[0]}`);
    } catch (err) {
        console.error('[WeeklyStats] Error:', err);
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Record Monthly Statistics
 * Runs on the last day of each month at 23:55
 * Records the count of new patients for the current month
 */
exports.recordMonthlyStats = async () => {
    let conn;
    try {
        conn = await pool.getConnection();

        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const [count] = await conn.query(
            `SELECT COUNT(*) as total FROM patients 
             WHERE is_new_patient = 1 
             AND marked_new_at >= ? AND marked_new_at <= ?`,
            [monthStart, monthEnd]
        );

        await conn.query(
            `INSERT INTO patient_statistics 
             (period_type, period_start, period_end, new_patients_count) 
             VALUES ('monthly', ?, ?, ?)
             ON DUPLICATE KEY UPDATE new_patients_count = ?`,
            [
                monthStart.toISOString().split('T')[0],
                monthEnd.toISOString().split('T')[0],
                count[0].total,
                count[0].total
            ]
        );

        console.log(`[MonthlyStats] Recorded ${count[0].total} new patients for ${monthStart.toISOString().split('T')[0]}`);
    } catch (err) {
        console.error('[MonthlyStats] Error:', err);
    } finally {
        if (conn) conn.release();
    }
};
