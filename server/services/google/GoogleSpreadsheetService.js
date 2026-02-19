const { google } = require('googleapis');
const { logAction } = require('../../utils/audit');
const googleAuthService = require('./GoogleAuthService');
const googleIntegrationRepository = require('../../repositories/googleIntegrationRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const systemSettingsRepository = require('../../repositories/systemSettingsRepository');

/**
 * GoogleSpreadsheetService
 * Handles financial synchronization to Google Sheets.
 */
class GoogleSpreadsheetService {
    constructor() {
        this.sheetNameCache = {};
    }

    /**
     * Sync a single transaction to Google Sheets
     */
    async syncToSpreadsheet(transactionId, userId = null) {
        // Fetch full details using repository
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

        if (!spreadsheetId && tx.doctor_id) {
            const createResponse = await sheets.spreadsheets.create({
                resource: {
                    properties: { title: `Finanzas - Secretaría App / ${tx.doctor_name || 'Dr.'}` },
                    sheets: [{ properties: { title: 'Pagos', gridProperties: { frozenRowCount: 1 } } }]
                }
            });
            spreadsheetId = createResponse.data.spreadsheetId;
            await googleIntegrationRepository.updateSpreadsheetId(tx.doctor_id, spreadsheetId);
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Pagos!A1:L1',
                valueInputOption: 'RAW',
                resource: {
                    values: [['Fecha', 'Hora', 'Año', 'Mes', 'Semana', 'Paciente/Detalle', 'Valor', 'Tipo', 'Cobrado', 'Pendiente', 'Médico', 'ID Interno']]
                }
            });
        }

        if (!spreadsheetId) return;

        const dateObj = new Date(tx.transaction_date);
        const rowValues = [
            dateObj.toLocaleDateString('es-AR'),
            dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            dateObj.getFullYear(),
            dateObj.getMonth() + 1,
            this.getWeekNumber(dateObj),
            tx.patient_name || tx.description || 'N/A',
            (tx.type === 'withdrawal' || tx.is_withdrawal === 1) ? -Number(tx.amount) : Number(tx.amount),
            tx.appointment_id ? 'Turno' : (tx.request_id ? 'Solicitud' : 'Otro'),
            tx.status === 'paid' ? ((tx.type === 'withdrawal' || tx.is_withdrawal === 1) ? -Number(tx.amount) : Number(tx.amount)) : 0,
            tx.status === 'pending' ? Number(tx.amount) : 0,
            tx.doctor_name || 'N/A',
            tx.id
        ];

        if (!this.sheetNameCache[spreadsheetId]) {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            this.sheetNameCache[spreadsheetId] = spreadsheet.data.sheets[0].properties.title;
        }
        const sheetName = this.sheetNameCache[spreadsheetId];

        const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!L:L` });
        const ids = result.data.values ? result.data.values.map(row => row[0]) : [];
        const rowIndex = ids.findIndex(id => id == tx.id);

        if (rowIndex !== -1) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${rowIndex + 1}:L${rowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowValues] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:L`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowValues] }
            });
        }

        if (userId) {
            await logAction({ user: { user_id: userId }, ip: 'SYSTEM' }, 'SPREADSHEET_SYNC', `Synced Tx ${tx.id}`);
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
