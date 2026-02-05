
const { pool } = require('../db');
const spreadsheetService = require('../services/spreadsheetService');

async function testSpreadsheetCecilia() {
    console.log("=== PROBANDO SPREADSHEET PARA CECILIA (ID 10) ===");
    let conn;
    try {
        conn = await pool.getConnection();

        const testData = {
            date: new Date().toLocaleDateString('es-AR'),
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            transaction_date: new Date(),
            patient: "Test Cecilia (Planilla)",
            reason: "Verificación de Sincronización",
            amount: 120000.00,
            method: "Transferencia",
            category: "Turno",
            type: "income_patient",
            id: 88888
        };

        console.log("🚀 Enviando transacción al servicio de Planillas...");
        await spreadsheetService.logTransaction(conn, 10, testData);

        const [rows] = await conn.query("SELECT spreadsheet_id FROM doctor_integrations WHERE doctor_id = 10");
        if (rows && rows.length > 0 && rows[0].spreadsheet_id) {
            console.log(`✅ EXITO: Planilla creada/detectada: ${rows[0].spreadsheet_id}`);
            console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${rows[0].spreadsheet_id}`);
        } else {
            console.log("⚠️ El log terminó pero no se guardó el ID en la DB.");
        }

    } catch (e) {
        console.error("❌ ERROR CRITICO:", e.message);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

testSpreadsheetCecilia();
