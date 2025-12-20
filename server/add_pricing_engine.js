const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Updating schema for Pricing Engine & Extended Payments...");

        // 1. Payment Status for Prescriptions & Licenses
        await conn.query("ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'debt') DEFAULT 'pending'");
        await conn.query("ALTER TABLE medical_licenses ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'debt') DEFAULT 'pending'");

        // 2. Pricing Engine - Doctors
        await conn.query("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_price DECIMAL(10,2) DEFAULT 0.00");

        // 3. Pricing Engine - Patients
        // tariff_percent: e.g. 10 for +10%
        // tariff_override: explicit float price to override standard calculation
        await conn.query("ALTER TABLE patients ADD COLUMN IF NOT EXISTS tariff_percent INT DEFAULT 0");
        await conn.query("ALTER TABLE patients ADD COLUMN IF NOT EXISTS tariff_override DECIMAL(10,2) DEFAULT NULL");

        console.log("Migration complete.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
