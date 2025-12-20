const { pool } = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const migrate = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to Database. Checking for missing DNI columns...");

        // Doctors
        try {
            const [rows] = await conn.query("SHOW COLUMNS FROM doctors LIKE 'dni'");
            if (rows && rows.length > 0) {
                console.log("Column 'dni' already exists in 'doctors'.");
            } else {
                console.log("Adding 'dni' column to 'doctors'...");
                await conn.query("ALTER TABLE doctors ADD COLUMN dni VARCHAR(50) DEFAULT NULL");
                console.log("Column 'dni' added to 'doctors'.");
            }
        } catch (e) {
            console.error("Error checking doctors:", e);
        }

        // Secretaries
        try {
            const [rows] = await conn.query("SHOW COLUMNS FROM secretaries LIKE 'dni'");
            if (rows && rows.length > 0) {
                console.log("Column 'dni' already exists in 'secretaries'.");
            } else {
                console.log("Adding 'dni' column to 'secretaries'...");
                await conn.query("ALTER TABLE secretaries ADD COLUMN dni VARCHAR(50) DEFAULT NULL");
                console.log("Column 'dni' added to 'secretaries'.");
            }
        } catch (e) {
            console.error("Error checking secretaries:", e);
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
};

migrate();
