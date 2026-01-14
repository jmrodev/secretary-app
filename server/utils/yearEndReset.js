const { pool } = require('../db');

/**
 * Year-End Reset Process
 * Executes on December 31st at 23:58
 * 1. Counts all patients marked as "new" (is_new_patient = 1)
 * 2. Records this count in patient_statistics as yearly data
 * 3. Resets all patients' is_new_patient flag to 0
 */
exports.executeYearEndReset = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        const currentYear = new Date().getFullYear();

        console.log(`[YearEndReset] Starting reset for year ${currentYear}...`);

        // 1. Count current new patients before reset
        const [count] = await conn.query(
            'SELECT COUNT(*) as total FROM patients WHERE is_new_patient = 1'
        );

        const newPatientsCount = count[0].total;
        console.log(`[YearEndReset] Found ${newPatientsCount} new patients to record`);

        // 2. Record yearly statistics
        await conn.query(
            `INSERT INTO patient_statistics 
             (period_type, period_start, period_end, new_patients_count) 
             VALUES ('yearly', ?, ?, ?)
             ON DUPLICATE KEY UPDATE new_patients_count = ?`,
            [
                `${currentYear}-01-01`,
                `${currentYear}-12-31`,
                newPatientsCount,
                newPatientsCount
            ]
        );

        // 3. Reset all patients' is_new_patient flag
        const result = await conn.query(
            'UPDATE patients SET is_new_patient = 0 WHERE is_new_patient = 1'
        );

        console.log(`[YearEndReset] Reset ${result.affectedRows} patients. Yearly stats recorded.`);

        return {
            success: true,
            patientsReset: result.affectedRows,
            yearlyCount: newPatientsCount
        };

    } catch (err) {
        console.error('[YearEndReset] Error:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
};
