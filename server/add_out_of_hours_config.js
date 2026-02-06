const { pool } = require('./db');

async function addOutOfHoursConfig() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Insertar o actualizar la configuración
        await conn.query(`
            INSERT INTO system_settings (setting_key, setting_value, updated_at) 
            VALUES ('daily_out_of_hours_limit', '3', NOW())
            ON DUPLICATE KEY UPDATE 
                setting_value = '3',
                updated_at = NOW()
        `);

        console.log('✅ Configuración agregada: daily_out_of_hours_limit = 3');

        // Verificar
        const result = await conn.query(
            "SELECT * FROM system_settings WHERE setting_key = 'daily_out_of_hours_limit'"
        );

        console.log('Verificación:', result);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

addOutOfHoursConfig();
