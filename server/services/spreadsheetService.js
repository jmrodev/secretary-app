const googleSpreadsheetService = require('./google/GoogleSpreadsheetService');

/**
 * SpreadsheetService (Legacy Bridge)
 * This service is kept for compatibility with old code, delegating to GoogleSpreadsheetService.
 */
class SpreadsheetService {
    /**
     * Log a transaction to the doctor's Google Spreadsheet
     * @param {Object} conn Database connection (not strictly needed now as GoogleSpreadsheetService gets its own)
     * @param {Number} doctorId 
     * @param {Object} data Transaction data (must include id or transactionId)
     */
    async logTransaction(conn, doctorId, data) {
        const txId = data.id || data.transactionId;
        if (!txId) {
            console.warn("[SpreadsheetService] Cannot sync: Missing transaction ID", data);
            return;
        }
        return googleSpreadsheetService.syncToSpreadsheet(txId);
    }
}

module.exports = new SpreadsheetService();

