const { google } = require('googleapis');
const googleController = require('../controllers/googleController');

class SpreadsheetService {
    /**
     * Log a transaction to the doctor's Google Spreadsheet
     * @param {Object} conn Database connection
     * @param {Number} doctorId 
     * @param {Object} transactionData { date, time, patient, reason, amount, method, type }
     */
    async logTransaction(conn, doctorId, data) {
        try {
            if (!doctorId) return;

            const tokens = await googleController.getTokens(conn, doctorId);
            if (!tokens.google_refresh_token) {
                console.log(`[SpreadsheetService] Doctor ${doctorId} has no Google integration.`);
                return;
            }

            const oauth2Client = googleController.getOAuthClient();
            oauth2Client.setCredentials({
                refresh_token: tokens.google_refresh_token,
                access_token: tokens.google_access_token,
                expiry_date: parseInt(tokens.google_token_expiry)
            });

            const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
            let spreadsheetId = tokens.spreadsheet_id;

            // 1. Create spreadsheet if it doesn't exist
            if (!spreadsheetId) {
                console.log(`[SpreadsheetService] Creating new spreadsheet for Doctor ${doctorId}...`);
                const response = await sheets.spreadsheets.create({
                    resource: {
                        properties: {
                            title: `Finanzas - Secretaría App / Dr. ID ${doctorId}`
                        },
                        sheets: [
                            {
                                properties: {
                                    title: 'Pagos',
                                    gridProperties: {
                                        frozenRowCount: 1
                                    }
                                }
                            }
                        ]
                    }
                });

                spreadsheetId = response.data.spreadsheetId;

                // Save spreadsheetId to DB
                await conn.query("UPDATE doctor_integrations SET spreadsheet_id = ? WHERE doctor_id = ?", [spreadsheetId, doctorId]);

                // Add header row
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Pagos!A1:L1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['Fecha', 'Hora', 'Año', 'Mes', 'Semana', 'Paciente', 'Motivo', 'Monto', 'Método', 'Categoría', 'Tipo Original', 'ID Interno']]
                    }
                });
            }

            // 2. Prepare granular date data
            const dateObj = data.transaction_date ? new Date(data.transaction_date) : new Date();
            const year = dateObj.getFullYear();
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const month = monthNames[dateObj.getMonth()];

            // ISO Week calculation
            const getWeek = (d) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };
            const week = getWeek(dateObj);

            // 3. Append data row
            const values = [
                [
                    data.date || dateObj.toLocaleDateString('es-AR'),
                    data.time || dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    year,
                    month,
                    week,
                    data.patient || 'N/A',
                    data.reason || 'S/D',
                    data.amount || 0,
                    data.method || 'Efectivo',
                    data.category || 'Varios',
                    data.type || 'Ingreso',
                    data.id || 'N/A'
                ]
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Pagos!A2',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values
                }
            });

            console.log(`[SpreadsheetService] Successfully logged to Spreadsheet ${spreadsheetId}`);

        } catch (err) {
            console.error(`[SpreadsheetService] Error logging to spreadsheet for doctor ${doctorId}:`, err.message);
        }
    }
}

module.exports = new SpreadsheetService();
