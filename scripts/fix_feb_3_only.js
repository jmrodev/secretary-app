
const { pool } = require('../db');
const googleController = require('../controllers/googleController');

async function syncFeb3Only() {
    console.log("=== FORZANDO SOLO 3 DE FEBRERO ===");
    const date = '2026-02-03';
    const user = { user_id: 1, username: 'force_feb3' };

    try {
        await new Promise((resolve, reject) => {
            const req = {
                body: { doctorId: 10, date: date },
                user: user
            };

            const res = {
                json: (data) => {
                    console.log(`   ✅ Resultado Feb 3: Creados: ${data.created}, Actualizados: ${data.updated}, Errores: ${data.errors}`);
                    resolve(data);
                },
                status: (code) => {
                    return {
                        json: (err) => {
                            console.error(`   ❌ Error ${code}:`, err);
                            resolve((err && err.error) || 'Error');
                        }
                    }
                }
            };
            googleController.syncDayToGoogle(req, res);
        });
    } catch (e) {
        console.error(`   💀 Error critico:`, e.message);
    }
    process.exit(0);
}

syncFeb3Only();
