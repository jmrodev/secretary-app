
const { pool } = require('../db');
const googleController = require('../controllers/googleController');

async function syncSpecificDays() {
    console.log("=== SINCRONIZANDO 3 Y 4 DE FEBRERO 2026 ===");

    // Dates to sync
    const dates = ['2026-02-03', '2026-02-04'];

    // Mock user
    const user = { user_id: 1, username: 'fix_admin' };

    for (const date of dates) {
        console.log(`\n⏳ Procesando: ${date}...`);

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
                                resolve(null);
                            }
                        }
                    }
                };

                googleController.syncDayToGoogle(req, res);
            });
        } catch (e) {
            console.error(`   💀 Error en fecha ${date}:`, e.message);
        }
    }

    console.log("\n=== LIENZO REPARADO PARA 3 Y 4 DE FEBRERO ===");
    process.exit(0);
}

syncSpecificDays();
