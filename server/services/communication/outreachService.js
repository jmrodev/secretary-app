const { pool } = require('../../db');
const whatsappService = require('./whatsappService');

/**
 * Build a SQL query for a patient segment type.
 * @param {string} type - Segment type: this_week, date_range, this_year, since_year_ago, upcoming, custom
 * @param {string} [startDate] - Start date for date_range/custom segments (YYYY-MM-DD)
 * @param {string} [endDate] - End date for date_range/custom segments (YYYY-MM-DD)
 * @returns {{ sql: string, params: array }} SQL query and bind params
 */
function buildSegmentSql(type, startDate, endDate) {
    const baseSelect = `SELECT DISTINCT p.id, p.full_name, p.phone
FROM patients p
INNER JOIN appointments a ON a.patient_id = p.id`;
    const phoneFilter = `AND p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8`;

    switch (type) {
        case 'this_week':
            return {
                sql: `${baseSelect}
WHERE YEARWEEK(a.appointment_date) = YEARWEEK(CURDATE())
  ${phoneFilter}
ORDER BY p.full_name ASC`,
                params: []
            };

        case 'date_range':
            if (!startDate || !endDate) {
                throw new Error('start_date and end_date are required for date_range segment');
            }
            return {
                sql: `${baseSelect}
WHERE a.appointment_date BETWEEN ? AND ?
  ${phoneFilter}
ORDER BY p.full_name ASC`,
                params: [startDate, endDate]
            };

        case 'this_year':
            return {
                sql: `${baseSelect}
WHERE YEAR(a.appointment_date) = YEAR(CURDATE())
  ${phoneFilter}
ORDER BY p.full_name ASC`,
                params: []
            };

        case 'since_year_ago': {
            const sinceSql = `SELECT p.id, p.full_name, p.phone
FROM patients p
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a
  WHERE a.patient_id = p.id AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
)
  AND p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8
ORDER BY p.full_name ASC`;
            return { sql: sinceSql, params: [] };
        }

        case 'upcoming':
            return {
                sql: `${baseSelect}
WHERE a.appointment_date > NOW()
  ${phoneFilter}
ORDER BY p.full_name ASC`,
                params: []
            };

        case 'custom':
            if (!startDate || !endDate) {
                throw new Error('start_date and end_date are required for custom segment');
            }
            return {
                sql: `${baseSelect}
WHERE a.appointment_date BETWEEN ? AND ?
  ${phoneFilter}
ORDER BY p.full_name ASC`,
                params: [startDate, endDate]
            };

        default:
            throw new Error(`Unknown segment type: ${type}`);
    }
}

/**
 * Get patients for a given segment type.
 * @param {string} type - Segment type
 * @param {string} [startDate] - Start date (for date_range/custom)
 * @param {string} [endDate] - End date (for date_range/custom)
 * @returns {Promise<Array>} Array of patient objects { id, full_name, phone }
 */
async function getSegmentPatients(type, startDate, endDate) {
    const { sql, params } = buildSegmentSql(type, startDate, endDate);
    return await pool.query(sql, params);
}

/**
 * Send a broadcast message to a list of patient IDs, alternating message variants.
 * @param {number[]} patientIds - Array of patient IDs
 * @param {string} body - Message body text
 * @param {Array<{header: string, body: string, footer: string}>} [variants] - Message variants
 * @param {number} [delayMs=4000] - Delay between sends in ms (0 for testing)
 * @returns {Promise<{total_sent: number, total_failed: number, results: Array}>}
 */
async function sendBroadcast(patientIds, body, variants, delayMs = 4000) {
    const results = { total_sent: 0, total_failed: 0, results: [] };

    if (!patientIds || patientIds.length === 0) {
        return results;
    }

    // Query patient names for personalization
    const placeholders = patientIds.map(() => '?').join(',');
    let patients;
    try {
        patients = await pool.query(
            `SELECT id, full_name, phone FROM patients WHERE id IN (${placeholders})`,
            patientIds
        );
    } catch (err) {
        throw new Error('Failed to fetch patient details for broadcast: ' + err.message);
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const patientName = patient.full_name || patient.phone;

        let message;
        if (variants && variants.length > 0) {
            const tmpl = variants[i % variants.length];
            const header = (tmpl.header || '').replace(/\{patient_name\}/g, patientName);
            const footer = (tmpl.footer || '').replace(/\{patient_name\}/g, patientName);
            const resolvedBody = body.replace(/\{patient_name\}/g, patientName);
            message = [header, resolvedBody, footer].filter(Boolean).join('\n\n');
        } else {
            message = body.replace(/\{patient_name\}/g, patientName);
        }

        try {
            await whatsappService.sendMessageDirect(patient.phone, message, patient.id);
            results.total_sent++;
            results.results.push({ patient_id: patient.id, status: 'sent' });
        } catch (error) {
            console.error(`[Outreach Broadcast] Failed for patient ${patient.id}:`, error.message);
            results.total_failed++;
            results.results.push({ patient_id: patient.id, status: 'failed', error: error.message });
        }

        // Respectful delay between sends to avoid rate-limiting
        if (delayMs > 0) await sleep(delayMs);
    }

    return results;
}

module.exports = {
    buildSegmentSql,
    getSegmentPatients,
    sendBroadcast
};
