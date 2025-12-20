const bcrypt = require('bcrypt');
const { pool } = require('./db');
const dotenv = require('dotenv');

dotenv.config();

async function seed() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database...");

        const users = [
            { username: 'admin', password: 'password123', role: 'admin', name: 'System Admin' },
            { username: 'doctor1', password: 'password123', role: 'doctor', name: 'Dr. Gregory House', specialty: 'Diagnostician' },
            { username: 'secretary1', password: 'password123', role: 'secretary', name: 'Joan Holloway' },
            { username: 'patient1', password: 'password123', role: 'patient', name: 'John Doe', dob: '1980-01-01' }
        ];

        for (const user of users) {
            // Check if exists
            const existing = await conn.query("SELECT * FROM users WHERE username = ?", [user.username]);
            if (existing.length > 0) {
                console.log(`User ${user.username} already exists.`);
                continue;
            }

            const hashed = await bcrypt.hash(user.password, 10);
            const res = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [user.username, hashed, user.role]);
            const userId = Number(res.insertId);
            console.log(`Created user ${user.username}`);

            if (user.role === 'doctor') {
                await conn.query("INSERT INTO doctors (user_id, full_name, specialty) VALUES (?, ?, ?)", [userId, user.name, user.specialty]);
            } else if (user.role === 'secretary') {
                await conn.query("INSERT INTO secretaries (user_id, full_name) VALUES (?, ?)", [userId, user.name]);
            } else if (user.role === 'patient') {
                await conn.query("INSERT INTO patients (user_id, full_name, dob) VALUES (?, ?, ?)", [userId, user.name, user.dob]);
            }
        }

        console.log("Seeding complete!");

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

seed();
