
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3310
});

async function cleanup() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('--- Iniciando Limpieza de Cierres Duplicados en PRODUCCIÓN ---');

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
            const dateMatch = tx.description.match(/\d{4}-\d{2}-\d{2}/);
            let dateKey = '';

            if (dateMatch) {
                dateKey = dateMatch[0];
            } else {
                const d = new Date(tx.transaction_date);
                dateKey = d.toISOString().split('T')[0];
            }

            // Clave única: Doctor + Fecha + Método
            const uniqueKey = `${tx.doctor_id}_${dateKey}_${tx.method}`;

            if (seen.has(uniqueKey)) {
                toDelete.push(tx.id);
                console.log(`[DUPLICADO PROD] ID: ${tx.id} | Fecha: ${dateKey} | Dr: ${tx.doctor_id} | Método: ${tx.method} | Monto: ${tx.amount}`);
            } else {
                seen.add(uniqueKey);
            }
        }

        if (toDelete.length > 0) {
            console.log(`\nEliminando ${toDelete.length} transacciones duplicadas en PROD...`);
            await conn.query(`DELETE FROM transactions WHERE id IN (${toDelete.join(',')})`);
            console.log('¡Limpieza de PRODUCCIÓN completada con éxito!');
        } else {
            console.log('No se encontraron duplicados en PRODUCCIÓN.');
        }

    } catch (err) {
        console.error('Error durante la limpieza de PROD:', err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

cleanup();
