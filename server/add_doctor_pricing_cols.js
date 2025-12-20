const { pool } = require('./db');

async function addDoctorPricingCols() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Adding pricing columns to doctors table...");

        const cols = [
            "prescription_price DECIMAL(10, 2) DEFAULT 0",
            "medical_license_price DECIMAL(10, 2) DEFAULT 0",
            "virtual_consultation_price DECIMAL(10, 2) DEFAULT 0"
        ];

        for (const colDef of cols) {
            try {
                const colName = colDef.split(' ')[0];
                await conn.query(`ALTER TABLE doctors ADD COLUMN ${colDef}`);
                console.log(`Added ${colName}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    // console.log("Column already exists"); 
                } else {
                    console.error(`Failed to add col: ${e.message}`);
                }
            }
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

addDoctorPricingCols();
