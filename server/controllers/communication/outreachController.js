const outreachService = require('../../services/communication/outreachService');

/**
 * Outreach Controller
 * Handles patient segment queries and broadcast send operations.
 */

/**
 * GET /api/outreach/segments
 * Query patients by segment type.
 * Query params: type, start_date, end_date
 */
const getSegments = async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;

        if (!type) {
            return res.status(400).json({ error: 'Segment type is required' });
        }

        const patients = await outreachService.getSegmentPatients(type, start_date, end_date);
        res.json({ patients, total: patients.length });
    } catch (error) {
        console.error('[Outreach Controller] getSegments error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/outreach/send
 * Send broadcast message to selected patients.
 * Body: { patient_ids: number[], body: string, variants?: Array<{header, body, footer}> }
 */
const sendBroadcast = async (req, res) => {
    try {
        const { patient_ids, body, variants } = req.body;

        if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
            return res.status(400).json({ error: 'patient_ids array is required and must not be empty' });
        }

        if (!body || !body.trim()) {
            return res.status(400).json({ error: 'body text is required' });
        }

        const result = await outreachService.sendBroadcast(patient_ids, body, variants || null);
        res.json(result);
    } catch (error) {
        console.error('[Outreach Controller] sendBroadcast error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSegments,
    sendBroadcast
};
