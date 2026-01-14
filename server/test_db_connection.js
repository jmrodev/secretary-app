const { pool } = require('./db');
require('dotenv').config();

async function testConnection() {
    try {
        console.log("Testing DB Connection...");
        console.log("Host:", process.env.DB_HOST);
        console.log("User:", process.env.DB_USER);
        console.log("Port:", process.env.DB_PORT || 3306);

        const conn = await pool.getConnection();
        console.log("Successfully connected!");
        const [rows] = await conn.query("SELECT 1 as val");
        console.log("Query Result:", rows);
        conn.release();
        process.exit(0);
    } catch (err) {
        console.error("Connection Failed:", err);
        process.exit(1); // Exit with error code
    }
}

testConnection();
