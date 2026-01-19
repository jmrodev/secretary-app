// require('dotenv').config(); // Load env if possible, or mocked
const mysql = require('mysql2/promise');

// Mock config if .env not loaded or try to infer. 
// Assuming standard development credentials or trying to read .env
// I'll try to read .env first to be safe.
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const envPath = path.resolve(__dirname, 'server/.env');
        let dbConfig = {};
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) process.env[key.trim()] = value.trim();
            });
        }

        // Fallback or Env
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'secretary',
            password: process.env.DB_PASSWORD || 'secretary123',
            database: process.env.DB_NAME || 'secretary_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("System Timezone Offset (min):", new Date().getTimezoneOffset());
        console.log("Current Time:", new Date().toString());

        const query = "SELECT appointment_date, id FROM appointments WHERE appointment_date LIKE '2026-02-04%'";
        console.log("Executing:", query);

        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        await pool.end();

        console.log("Found:", rows.length, "appointments.");
        rows.forEach(row => {
            const d = row.appointment_date;
            console.log(`ID: ${row.id}`);
            console.log(`  Raw: ${d}`);
            console.log(`  Constructor: ${d.constructor.name}`);
            console.log(`  toString: ${d.toString()}`);
            console.log(`  toISOString: ${d.toISOString()}`);
            console.log(`  getTime: ${d.getTime()}`);
        });

    } catch (err) {
        console.error(err);
    }
}

run();
