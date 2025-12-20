const { pool } = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const migrate = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to Database. Checking for token_version column...");

        const [rows] = await conn.query("SHOW COLUMNS FROM users LIKE 'token_version'");

        if (rows && rows.length > 0) {
            console.log("Column 'token_version' already exists.");
        } else {
            console.log("Adding 'token_version' column...");
            await conn.query("ALTER TABLE users ADD COLUMN token_version INT DEFAULT 0");
            console.log("Column 'token_version' added successfully.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit(); // Explicitly exit
    }
};

migrate();
