/**
 * GoogleSpreadsheetHelper
 * Utility functions and formatting logic for Google Sheets integration.
 */
class GoogleSpreadsheetHelper {
    constructor() {
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    }

    /**
     * Get sheet name based on transaction metadata.
     */
    getSheetName(tx) {
        const date = new Date(tx.transaction_date);
        const month = this.months[date.getMonth()];
        const year = date.getFullYear();

        let subType = 'Expenses'; 
        if (tx.appointment_id) subType = 'Appointments';
        else if (tx.request_id) subType = 'Requests';
        else if (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') subType = 'Withdrawals';
        else if (tx.type?.startsWith('expense')) subType = 'Expenses';

        return `${month} ${year} - ${subType}`;
    }

    /**
     * Ensure a specific sheet exists within the spreadsheet, creating it and adding headers if necessary.
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

            // Add Headers: Fecha, Hora Turno, Paciente, Hora Llegada Sala, Hora Atendido, Hora Pago, Servicio, Monto Total, Cobrado, Saldo Turno, Medios de Pago, Bitácora/Notas, ID
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1:M1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Fecha', 'Hora Turno', 'Paciente', 'Hora Llegada Sala', 'Hora Atendido', 'Hora Pago', 'Servicio', 'Monto Total', 'Cobrado', 'Saldo Turno', 'Medios de Pago', 'Bitácora/Notas', 'ID']]
                }
            });
        }
    }

    /**
     * Clear data rows in a sheet while preserving headers.
     */
    async clearSheet(sheets, spreadsheetId, sheetName) {
        try {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${sheetName}!A2:Z10000`
            });
        } catch (err) {
            console.error(`[GoogleSpreadsheetHelper] Error clearing sheet ${sheetName}:`, err.message);
        }
    }

    /**
     * Returns a color object based on the transaction status/type.
     */
    getRowColor(tx) {
        if (tx.type === 'withdrawal' || tx.is_withdrawal === 1 || tx.type === 'payout') {
            return { red: 0.99, green: 0.88, blue: 0.88 }; // Soft Red (#fee2e2)
        } else if (tx.status === 'pending') {
            return { red: 0.99, green: 0.97, blue: 0.76 }; // Soft Yellow (#fef9c3)
        } else if (tx.status === 'paid') {
            return { red: 0.86, green: 0.98, blue: 0.90 }; // Soft Green (#dcfce7)
        }
        return { red: 1, green: 1, blue: 1 }; // Default white
    }

    /**
     * Apply background color to a specific row.
     */
    async formatRow(sheets, spreadsheetId, sheetName, rowIndex, tx) {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetObj = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
        if (!sheetObj) return;

        const sheetId = sheetObj.properties.sheetId;
        const color = this.getRowColor(tx);

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
                            endColumnIndex: 13
                        },
                        cell: {
                            userEnteredFormat: { backgroundColor: color }
                        },
                        fields: 'userEnteredFormat.backgroundColor'
                    }
                }]
            }
        });
    }

    getWeekNumber(d) {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }
}

module.exports = new GoogleSpreadsheetHelper();
