
const mariadb = require('mariadb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
});

async function cleanup() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('--- Iniciando Limpieza de Cierres Duplicados ---');

        // 1. Buscar transacciones de cierre
        const txs = await conn.query(`
      SELECT id, doctor_id, transaction_date, description, method, amount 
      FROM transactions 
      WHERE description LIKE 'Cierre Automático%' 
         OR description LIKE '%Cierre Manual%'
      ORDER BY id DESC
    `);

        const seen = new Set();
        const toDelete = [];

        for (const tx of txs) {
            // Extraer fecha del reporte (YYYY-MM-DD)
            const dateMatch = tx.description.match(/\d{4}-\d{2}-\d{2}/);
            let dateKey = '';

            if (dateMatch) {
                dateKey = dateMatch[0];
            } else {
                // Fallback a la fecha de la transacción
                const d = new Date(tx.transaction_date);
                dateKey = d.toISOString().split('T')[0];
            }

            // Clave única: Doctor + Fecha + Método (Efectivo/Transferencia)
            const uniqueKey = `${tx.doctor_id}_${dateKey}_${tx.method}`;

            if (seen.has(uniqueKey)) {
                toDelete.push(tx.id);
                console.log(`[DUPLICADO] ID: ${tx.id} | Fecha: ${dateKey} | Dr: ${tx.doctor_id} | Método: ${tx.method} | Monto: ${tx.amount}`);
            } else {
                seen.add(uniqueKey);
            }
        }

        if (toDelete.length > 0) {
            console.log(`\nEliminando ${toDelete.length} transacciones duplicadas...`);
            await conn.query(`DELETE FROM transactions WHERE id IN (${toDelete.join(',')})`);
            console.log('¡Limpieza completada con éxito!');
        } else {
            console.log('No se encontraron duplicados para eliminar.');
        }

    } catch (err) {
        console.error('Error durante la limpieza:', err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

cleanup();
