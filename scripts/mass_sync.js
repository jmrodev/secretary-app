
const { pool } = require('../db');
const googleController = require('../controllers/googleController');

async function syncMassive() {
    console.log("=== INICIANDO SINCRONIZACIÓN MASIVA (Enero - Febrero 2026) ===");

    // 1. Get List of Dates that have appointments in Jan/Feb for Dr. Cecilia (10)
    // We only care about active appointments (not cancelled) to populate the calendar.
    const conn = await pool.getConnection();
    let dates = [];
    try {
        const result = await conn.query(`
            SELECT DISTINCT DATE(appointment_date) as day 
            FROM appointments 
            WHERE doctor_id = 10 
            AND appointment_date >= '2026-02-01' 
            AND appointment_date <= '2026-05-31'
            AND status != 'cancelled'
            ORDER BY day ASC
        `);
        // Handle both [rows, fields] or just rows
        const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        dates = rows.map(r => {
            const d = new Date(r.day);
            return d.toISOString().split('T')[0]; // YYYY-MM-DD
        });
    } finally {
        conn.release();
    }

    console.log(`📆 Fechas encontradas con turnos: ${dates.length}`);

    // 2. Iterate and Sync Each Day
    // We mock the req/res objects for the controller
    const user = { user_id: 1, username: 'masivo_admin' }; // System user

    for (const date of dates) {
        console.log(`\n⏳ Sincronizando: ${date}...`);

        try {
            await new Promise((resolve, reject) => {
                const req = {
                    body: { doctorId: 10, date: date },
                    user: user
                };

                const res = {
                    json: (data) => {
                        console.log(`   ✅ Resultado: Creados: ${data.created}, Actualizados: ${data.updated}, Errores: ${data.errors}`);
                        resolve(data);
                    },
                    status: (code) => {
                        return {
                            json: (err) => {
                                console.error(`   ❌ Error ${code}:`, err);
                                // Don't reject, just continue to next day
                                resolve(null);
                            }
                        }
                    }
                };

                googleController.syncDayToGoogle(req, res);
            });

            // Small delay to be nice to Google API rate limits
            await new Promise(r => setTimeout(r, 500));

        } catch (e) {
            console.error(`   💀 Excepción inesperada en fecha ${date}:`, e.message);
        }
    }

    console.log("\n=== SINCRONIZACIÓN FINALIZADA ===");
    process.exit(0);
}

syncMassive();
