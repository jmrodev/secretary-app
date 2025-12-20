const { pool } = require('./db');

async function addDoctorRentalCols() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Adding rental columns to doctors table...");

        try {
            await conn.query("ALTER TABLE doctors ADD COLUMN office_number VARCHAR(50)");
            console.log("Added office_number");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("office_number already exists");
            else throw e;
        }

        try {
            await conn.query("ALTER TABLE doctors ADD COLUMN rental_type ENUM('hourly', 'daily', 'weekly', 'monthly') DEFAULT 'monthly'");
            console.log("Added rental_type");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("rental_type already exists");
            else throw e;
        }

        try {
            await conn.query("ALTER TABLE doctors ADD COLUMN rental_cost DECIMAL(10, 2) DEFAULT 0");
            console.log("Added rental_cost");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("rental_cost already exists");
            else throw e;
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

addDoctorRentalCols();
