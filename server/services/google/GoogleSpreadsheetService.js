const { google } = require('googleapis');
const { logAction } = require('../../utils/system/audit');
const googleAuthService = require('./GoogleAuthService');
const googleIntegrationRepository = require('../../repositories/user/googleIntegrationRepository');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');

/**
 * GoogleSpreadsheetService
 * Handles financial synchronization to Google Sheets.
 */
class GoogleSpreadsheetService {
    constructor() {
        this.sheetNameCache = {};
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    }

    /**
     * Get sheet name based on transaction
     */
    getSheetName(tx) {
        const date = new Date(tx.transaction_date);
        const month = this.months[date.getMonth()];
        const year = date.getFullYear();

        let subType = 'Expenses'; // Default if nothing else matches
        if (tx.appointment_id) subType = 'Appointments';
        else if (tx.request_id) subType = 'Requests';
        else if (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') subType = 'Withdrawals';
        else if (tx.type?.startsWith('expense')) subType = 'Expenses';

        return `${month} ${year} - ${subType}`;
    }

    /**
     * Ensure sheet exists and has headers
     */
    async ensureSheet(sheets, spreadsheetId, sheetName) {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);

        if (!sheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: { frozenRowCount: 1 }
                            }
                        }
                    }]
                }
            });

            // Add Headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1:G1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Date', 'Time', 'Patient', 'Value', 'Paid', 'Pending', 'Internal ID']]
                }
            });
        }
    }

    /**
     * Clear all data in a sheet except headers
     */
    async clearSheet(sheets, spreadsheetId, sheetName) {
        try {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${sheetName}!A2:Z10000`
            });
            console.log(`[GoogleSpreadsheetService] Cleared sheet: ${sheetName}`);
        } catch (err) {
            console.error(`[GoogleSpreadsheetService] Error clearing sheet ${sheetName}:`, err.message);
        }
    }

    /**
     * Apply row formatting based on status/type
     */
    async formatRow(sheets, spreadsheetId, sheetName, rowIndex, tx) {
        let color = { red: 1, green: 1, blue: 1 }; // Default white

        if (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') {
            color = { red: 0.99, green: 0.88, blue: 0.88 }; // Soft Red (#fee2e2)
        } else if (tx.status === 'pending') {
            color = { red: 0.99, green: 0.97, blue: 0.76 }; // Soft Yellow (#fef9c3)
        } else if (tx.status === 'paid') {
            color = { red: 0.86, green: 0.98, blue: 0.90 }; // Soft Green (#dcfce7)
        }

        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: rowIndex,
                            endRowIndex: rowIndex + 1,
                            startColumnIndex: 0,
                            endColumnIndex: 7
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: color
                            }
                        },
                        fields: 'userEnteredFormat.backgroundColor'
                    }
                }]
            }
        });
    }

    /**
     * Sync a single transaction to Google Sheets
     */
    async syncToSpreadsheet(transactionId, userId = null) {
        const tx = await transactionRepository.findFullDetailsById(transactionId);
        if (!tx) return;

        const oauth2Client = await googleAuthService.getAuthorizedClient(tx.doctor_id) || await googleAuthService.getAuthorizedClient(null);
        if (!oauth2Client) return;

        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

        let spreadsheetId = null;
        if (tx.doctor_id) {
            const integration = await googleIntegrationRepository.findDoctorIntegration(tx.doctor_id);
            if (integration && integration.spreadsheet_id) spreadsheetId = integration.spreadsheet_id;
        }

        if (!spreadsheetId) {
            const setting = await systemSettingsRepository.findByKey('finance_spreadsheet_id');
            spreadsheetId = setting ? setting.setting_value : null;
        }

        if (!spreadsheetId) return;

        const sheetName = this.getSheetName(tx);
        await this.ensureSheet(sheets, spreadsheetId, sheetName);

        const dateObj = new Date(tx.transaction_date);

        const rowValues = [
            dateObj.toLocaleDateString('es-AR'),
            dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            tx.patient_name || tx.description || 'N/A',
            (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') ? -Number(tx.amount) : Number(tx.amount),
            tx.status === 'paid' ? ((tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') ? -Number(tx.amount) : Number(tx.amount)) : 0,
            tx.status === 'pending' ? Number(tx.amount) : 0,
            tx.id
        ];

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
            // Append
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:G`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowValues] }
            });
            // Extract row index from range updated (e.g. "Sheet1!A10:L10")
            const updatedRange = appendResponse.data.updates.updatedRange;
            const match = updatedRange.match(/!A(\d+):/);
            finalRowIndex = match ? parseInt(match[1], 10) - 1 : ids.length;
        }

        // Apply background color to the data row
        await this.formatRow(sheets, spreadsheetId, sheetName, finalRowIndex, tx);

        if (userId) {
            await logAction({ user: { user_id: userId }, ip: 'SYSTEM' }, 'SPREADSHEET_SYNC', `Synced Tx ${tx.id} to ${sheetName}`);
        }
    }

    /**
     * Bulk Sync all transactions for a specific doctor or all
     */
    async bulkSync(doctorId = null, userId = null) {
        let query = `
            SELECT t.*, p.full_name as patient_name, d.full_name as doctor_name
            FROM transactions t
            LEFT JOIN users u ON t.related_user_id = u.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN doctors d ON t.doctor_id = d.id
        `;
        const params = [];
        if (doctorId) {
            query += " WHERE t.doctor_id = ?";
            params.push(doctorId);
        }
        query += " ORDER BY t.transaction_date ASC";

        const { pool } = require('../../db');
        const transactions = await pool.query(query, params);

        console.log(`[GoogleSpreadsheetService] Starting bulk sync for ${transactions.length} transactions...`);

        // 1. Group by spreadsheetId
        const bySpreadsheet = {};
        for (const tx of transactions) {
            let spreadsheetId = null;
            if (tx.doctor_id) {
                const integration = await googleIntegrationRepository.findDoctorIntegration(tx.doctor_id);
                if (integration && integration.spreadsheet_id) spreadsheetId = integration.spreadsheet_id;
            }
            if (!spreadsheetId) {
                const setting = await systemSettingsRepository.findByKey('finance_spreadsheet_id');
                spreadsheetId = setting ? setting.setting_value : null;
            }

            if (!spreadsheetId) continue;
            if (!bySpreadsheet[spreadsheetId]) {
                bySpreadsheet[spreadsheetId] = {
                    txs: [],
                    representativeDoctorId: tx.doctor_id || null
                };
            }
            bySpreadsheet[spreadsheetId].txs.push(tx);
        }

        for (const spreadsheetId of Object.keys(bySpreadsheet)) {
            const { txs, representativeDoctorId } = bySpreadsheet[spreadsheetId];
            const oauth2Client = await googleAuthService.getAuthorizedClient(representativeDoctorId) || await googleAuthService.getAuthorizedClient(null);
            if (!oauth2Client) {
                console.warn(`[GoogleSpreadsheetService] No auth found for spreadsheet ${spreadsheetId}`);
                continue;
            }

            const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
            console.log(`  -> Processing spreadsheet ${spreadsheetId} with ${txs.length} txs`);

            // 2. Group by sheet name
            const bySheet = {};
            for (const tx of txs) {
                const name = this.getSheetName(tx);
                if (!bySheet[name]) bySheet[name] = [];
                bySheet[name].push(tx);
            }

            for (const sheetName of Object.keys(bySheet)) {
                console.log(`  -> Recreating sheet "${sheetName}" in spreadsheet ${spreadsheetId}`);
                await this.ensureSheet(sheets, spreadsheetId, sheetName);
                await this.clearSheet(sheets, spreadsheetId, sheetName);

                const sheetTxs = bySheet[sheetName];
                const allRowValues = [];
                const formatRequests = [];

                // Fetch sheetId once for the current spreadsheet and sheetName
                const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
                const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

                for (let i = 0; i < sheetTxs.length; i++) {
                    const tx = sheetTxs[i];
                    const dateObj = new Date(tx.transaction_date);
                    // rowIndex for Google Sheets API is 0-based.
                    // If headers are in row 1, then the first data row (row 2) has startRowIndex = 1.
                    const apiRowIndex = i + 1;

                    const values = [
                        dateObj.toLocaleDateString('es-AR'),
                        dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                        tx.patient_name || tx.description || 'N/A',
                        (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') ? -Number(tx.amount) : Number(tx.amount),
                        tx.status === 'paid' ? ((tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') ? -Number(tx.amount) : Number(tx.amount)) : 0,
                        tx.status === 'pending' ? Number(tx.amount) : 0,
                        tx.id
                    ];
                    allRowValues.push(values);

                    // Build color request
                    let color = { red: 1, green: 1, blue: 1 };
                    if (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') {
                        color = { red: 0.99, green: 0.88, blue: 0.88 }; // Soft Red (#fee2e2)
                    } else if (tx.status === 'pending') {
                        color = { red: 0.99, green: 0.97, blue: 0.76 }; // Soft Yellow (#fef9c3)
                    } else if (tx.status === 'paid') {
                        color = { red: 0.86, green: 0.98, blue: 0.90 }; // Soft Green (#dcfce7)
                    }

                    formatRequests.push({
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: apiRowIndex,
                                endRowIndex: apiRowIndex + 1, // Apply to a single row
                                startColumnIndex: 0,
                                endColumnIndex: 7 // Columns A to G
                            },
                            cell: { userEnteredFormat: { backgroundColor: color } },
                            fields: 'userEnteredFormat.backgroundColor'
                        }
                    });
                }

                // 1. Bulk Update Values (starting from row 2, which is API index 1)
                if (allRowValues.length > 0) {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `${sheetName}!A2`, // Start writing from A2
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: allRowValues }
                    });
                }


                // 2. Bulk Update Formatting
                if (formatRequests.length > 0) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        resource: { requests: formatRequests }
                    });
                }

                console.log(`     [Done] Synced ${sheetTxs.length} rows to ${sheetName}`);
            }
        }

        if (userId) {
            await logAction({ user: { user_id: userId }, ip: 'SYSTEM' }, 'SPREADSHEET_SYNC_BULK', `Triggered bulk sync for ${transactions.length} txs`);
        }
    }

    async resetSpreadsheetId(doctorId) {
        return await googleIntegrationRepository.resetSpreadsheetId(doctorId);
    }

    getWeekNumber(d) {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }
}

module.exports = new GoogleSpreadsheetService();
