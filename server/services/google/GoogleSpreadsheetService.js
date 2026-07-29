const { google } = require('googleapis');
const { logAction } = require('../../utils/system/audit');
const googleAuthService = require('./GoogleAuthService');
const googleIntegrationRepository = require('../../repositories/user/googleIntegrationRepository');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const helper = require('./GoogleSpreadsheetHelper');

/**
 * GoogleSpreadsheetService
 * Handles financial synchronization to Google Sheets.
 * Refactored to delegate utilities to GoogleSpreadsheetHelper.
 */
class GoogleSpreadsheetService {
    /**
     * Sync a single transaction to Google Sheets
     */
    async syncToSpreadsheet(transactionId, userId = null) {
        const tx = await transactionRepository.findFullDetailsById(transactionId);
        if (!tx) return;

        const oauth2Client = await googleAuthService.getAuthorizedClient(tx.doctor_id) || await googleAuthService.getAuthorizedClient(null);
        if (!oauth2Client) return;

        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const spreadsheetId = await this._getSpreadsheetId(tx.doctor_id);
        if (!spreadsheetId) return;

        const sheetName = helper.getSheetName(tx);
        await helper.ensureSheet(sheets, spreadsheetId, sheetName);

        const dateObj = new Date(tx.transaction_date);
        const rowValues = this._mapTxToRow(tx, dateObj);

        const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!G:G` });
        const ids = result.data.values ? result.data.values.map(row => row[0]) : [];
        const rowIndexInColumn = ids.findIndex(id => id == tx.id);

        let finalRowIndex;
        if (rowIndexInColumn !== -1) {
            finalRowIndex = rowIndexInColumn;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${finalRowIndex + 1}:G${finalRowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowValues] }
            });
        } else {
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:G`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowValues] }
            });
            const updatedRange = appendResponse.data.updates.updatedRange;
            const match = updatedRange.match(/!A(\d+):/);
            finalRowIndex = match ? parseInt(match[1], 10) - 1 : ids.length;
        }

        await helper.formatRow(sheets, spreadsheetId, sheetName, finalRowIndex, tx);

        if (userId) {
            await logAction({ user: { user_id: userId }, ip: 'SYSTEM' }, 'SPREADSHEET_SYNC', `Synced Tx ${tx.id} to ${sheetName}`);
        }
    }

    /**
     * Bulk Sync all transactions for a specific doctor or all
     */
    async bulkSync(doctorId = null, userId = null) {
        const { pool } = require('../../db');
        const query = `
            SELECT t.*, p.full_name as patient_name, d.full_name as doctor_name
            FROM transactions t
            LEFT JOIN users u ON t.related_user_id = u.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            ${doctorId ? 'WHERE t.doctor_id = ?' : ''}
            ORDER BY t.transaction_date ASC
        `;
        const transactions = await pool.query(query, doctorId ? [doctorId] : []);

        const bySpreadsheet = await this._groupBySpreadsheet(transactions);

        for (const spreadsheetId of Object.keys(bySpreadsheet)) {
            const { txs, representativeDoctorId } = bySpreadsheet[spreadsheetId];
            const oauth2Client = await googleAuthService.getAuthorizedClient(representativeDoctorId) || await googleAuthService.getAuthorizedClient(null);
            if (!oauth2Client) continue;

            const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
            const bySheet = this._groupBySheet(txs);

            for (const sheetName of Object.keys(bySheet)) {
                await helper.ensureSheet(sheets, spreadsheetId, sheetName);
                await helper.clearSheet(sheets, spreadsheetId, sheetName);

                const sheetTxs = bySheet[sheetName];
                const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
                const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

                const { allRowValues, formatRequests } = this._prepareBulkData(sheetTxs, sheetId);

                if (allRowValues.length > 0) {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `${sheetName}!A2`,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: allRowValues }
                    });
                }

                if (formatRequests.length > 0) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        resource: { requests: formatRequests }
                    });
                }
            }
        }

        if (userId) {
            await logAction({ user: { user_id: userId }, ip: 'SYSTEM' }, 'SPREADSHEET_SYNC_BULK', `Triggered bulk sync for ${transactions.length} txs`);
        }
    }

    async resetSpreadsheetId(doctorId) {
        return await googleIntegrationRepository.resetSpreadsheetId(doctorId);
    }

    // --- Private Helper Methods ---

    async _getSpreadsheetId(doctorId) {
        if (doctorId) {
            const integration = await googleIntegrationRepository.findDoctorIntegration(doctorId);
            if (integration && integration.spreadsheet_id) return integration.spreadsheet_id;
        }
        const setting = await systemSettingsRepository.findByKey('finance_spreadsheet_id');
        return setting ? setting.setting_value : null;
    }

    _mapTxToRow(tx, dateObj) {
        const amount = Number(tx.amount);
        const isOutflow = (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout');
        const val = isOutflow ? -amount : amount;

        return [
            dateObj.toLocaleDateString('es-AR'),
            dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            tx.patient_name || tx.description || 'N/A',
            val,
            tx.status === 'paid' ? val : 0,
            tx.status === 'pending' ? amount : 0,
            tx.id
        ];
    }

    async _groupBySpreadsheet(transactions) {
        const bySpreadsheet = {};
        for (const tx of transactions) {
            const spreadsheetId = await this._getSpreadsheetId(tx.doctor_id);
            if (!spreadsheetId) continue;
            if (!bySpreadsheet[spreadsheetId]) {
                bySpreadsheet[spreadsheetId] = { txs: [], representativeDoctorId: tx.doctor_id || null };
            }
            bySpreadsheet[spreadsheetId].txs.push(tx);
        }
        return bySpreadsheet;
    }

    _groupBySheet(txs) {
        const bySheet = {};
        for (const tx of txs) {
            const name = helper.getSheetName(tx);
            if (!bySheet[name]) bySheet[name] = [];
            bySheet[name].push(tx);
        }
        return bySheet;
    }

    _prepareBulkData(sheetTxs, sheetId) {
        const allRowValues = [];
        const formatRequests = [];

        for (let i = 0; i < sheetTxs.length; i++) {
            const tx = sheetTxs[i];
            const dateObj = new Date(tx.transaction_date);
            const apiRowIndex = i + 1;

            allRowValues.push(this._mapTxToRow(tx, dateObj));

            formatRequests.push({
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: apiRowIndex,
                        endRowIndex: apiRowIndex + 1,
                        startColumnIndex: 0,
                        endColumnIndex: 7
                    },
                    cell: { userEnteredFormat: { backgroundColor: helper.getRowColor(tx) } },
                    fields: 'userEnteredFormat.backgroundColor'
                }
            });
        }
        return { allRowValues, formatRequests };
    }
}

module.exports = new GoogleSpreadsheetService();
