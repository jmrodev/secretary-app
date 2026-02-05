
const { pool } = require('../db');
const spreadsheetService = require('../services/spreadsheetService');

async function testSpreadsheet() {
    console.log("=== PROBANDO SPREADSHEET PARA JUAN MARCELO (ID 13) ===");
    let conn;
    try {
        conn = await pool.getConnection();

        const testData = {
            date: new Date().toLocaleDateString('es-AR'),
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            transaction_date: new Date(),
            patient: "Paciente de Prueba (Marcelo)",
            reason: "Consulta de Test de Planilla",
            amount: 75000.00,
            method: "Efectivo",
            category: "Turno",
            type: "income_patient",
            id: 99999 // ID ficticio para el test
        };

        console.log("🚀 Enviando transacción al servicio de Planillas...");
        await spreadsheetService.logTransaction(conn, 13, testData);

        // Verificar si se guardó el ID en la DB
        const [rows] = await conn.query("SELECT spreadsheet_id FROM doctor_integrations WHERE doctor_id = 13");
        if (rows && rows.spreadsheet_id) {
            console.log(`✅ EXITO: Planilla creada/detectada: ${rows.spreadsheet_id}`);
            console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${rows.spreadsheet_id}`);
        } else {
            console.log("⚠️ El log terminó pero no se guardó el ID en la DB (o ya existía pero no se leyó bien).");
        }

    } catch (e) {
        console.error("❌ ERROR CRITICO EN EL TEST:", e.message);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

testSpreadsheet();
