
const { pool } = require('../db');
const googleController = require('../controllers/googleController');

async function debugFeb3() {
    console.log("=== DEBUG 3 DE FEBRERO (Appt ID 741 - 08:15) ===");
    const date = '2026-02-03';
    const user = { user_id: 1, username: 'debug_feb3' };

    // We can't easily hook into the controller's internal variables without modifying it again.
    // So we will modify the controller to LOG the duration it calculates.

    // Trigger sync
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
                            resolve('Error');
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

debugFeb3();
