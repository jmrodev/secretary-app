const { pool, dbReady } = require('../db');

async function runMigration() {
    await dbReady;
    const conn = await pool.getConnection();
    try {
        console.log("Checking columns in 'users' table...");
        const columns = [
            'can_crud_appointments',
            'can_edit_past_appointments',
            'can_crud_requests',
            'can_crud_prescriptions',
            'can_crud_licenses',
            'can_crud_files',
            'can_crud_finances'
        ];

        for (const col of columns) {
            const [exists] = await conn.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'users' 
                  AND COLUMN_NAME = ?
            `, [col]);

            if (exists.count === 0 || exists.count === '0' || Number(exists.count) === 0) {
                console.log(`Adding column '${col}' to 'users'...`);
                await conn.query(`ALTER TABLE users ADD COLUMN ${col} TINYINT(1) NOT NULL DEFAULT 0`);
            } else {
                console.log(`Column '${col}' already exists.`);
            }
        }

        // Initialize from system_settings if available
        console.log("Populating existing secretary permissions from system_settings...");
        try {
            await conn.query(`
                UPDATE users u
                CROSS JOIN (
                    SELECT 
                        MAX(CASE WHEN setting_key = 'enable_secretary_crud_appointments' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_appointments,
                        MAX(CASE WHEN setting_key = 'allow_secretary_edit_past_appointments' THEN setting_value = 'true' OR setting_value = '1' END) AS can_edit_past_appointments,
                        MAX(CASE WHEN setting_key = 'enable_secretary_crud_requests' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_requests,
                        MAX(CASE WHEN setting_key = 'enable_secretary_crud_prescriptions' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_prescriptions,
                        MAX(CASE WHEN setting_key = 'enable_secretary_crud_licenses' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_licenses,
                        MAX(CASE WHEN setting_key = 'enable_secretary_crud_files' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_files,
                        MAX(CASE WHEN setting_key = 'enable_secretary_finance_crud' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_finances
                    FROM system_settings
                ) s
                SET 
                    u.can_crud_appointments = COALESCE(s.can_crud_appointments, 0),
                    u.can_edit_past_appointments = COALESCE(s.can_edit_past_appointments, 0),
                    u.can_crud_requests = COALESCE(s.can_crud_requests, 0),
                    u.can_crud_prescriptions = COALESCE(s.can_crud_prescriptions, 0),
                    u.can_crud_licenses = COALESCE(s.can_crud_licenses, 0),
                    u.can_crud_files = COALESCE(s.can_crud_files, 0),
                    u.can_crud_finances = COALESCE(s.can_crud_finances, 0)
                WHERE u.role = 'secretary'
            `);
        } catch (populateErr) {
            console.warn("Could not populate from system_settings:", populateErr.message);
        }

        console.log("Migration executed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        conn.release();
        process.exit(0);
    }
}

runMigration();
