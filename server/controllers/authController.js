const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logAction } = require('../utils/audit');

exports.register = async (req, res) => {
    let conn;
    try {
        const { username, password, role, fullName, phone, specialty, cbu, dob, address, medicalHistory, dni, insurance } = req.body;

        if (!(username && password && role && fullName)) {
            return res.status(400).send('All input is required');
        }

        const validRoles = ['admin', 'secretary', 'doctor', 'patient'];
        if (!validRoles.includes(role)) {
            return res.status(400).send('Invalid role');
        }

        conn = await pool.getConnection();

        // Check if user already exists
        const existingUser = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
        if (existingUser.length > 0) {
            return res.status(409).send('User already exists');
        }

        // Encrypt password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await conn.query(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            [username, encryptedPassword, role]
        );

        const userId = Number(result.insertId);

        // Create Profile based on role

        if (role === 'doctor') {
            await conn.query("INSERT INTO doctors (user_id, full_name, specialty, phone, cbu, dni) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, fullName, specialty || null, phone || null, cbu || null, dni || null]);
        } else if (role === 'secretary') {
            await conn.query("INSERT INTO secretaries (user_id, full_name, phone, dni) VALUES (?, ?, ?, ?)",
                [userId, fullName, phone || null, dni || null]);
        } else if (role === 'patient') {
            await conn.query("INSERT INTO patients (user_id, full_name, dob, phone, address, medical_history, dni, insurance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [userId, fullName, dob || null, phone || null, address || null, medicalHistory || null, dni || null, insurance || null]);
        }

        // Create token
        const token = jwt.sign(
            { user_id: userId, username, role, token_version: 0 }, // Default is 0
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Audit Log
        const logReq = { body: { username }, ip: req.ip };
        logAction(logReq, 'REGISTER', `New user registered: ${username} as ${role}`);

        res.status(201).json({ user_id: userId, username, role, token });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.login = async (req, res) => {
    let conn;
    try {
        const { username, password } = req.body;

        if (!(username && password)) {
            return res.status(400).send("All input is required");
        }

        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

        if (rows.length > 0) {
            const user = rows[0];
            if (await bcrypt.compare(password, user.password_hash)) {
                // Create token
                const token = jwt.sign(
                    {
                        user_id: user.id,
                        username,
                        role: user.role,
                        token_version: user.token_version // Add version to token
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "24h" }
                );

                // Audit Log
                const logReq = { user: { user_id: user.id, username: user.username }, ip: req.ip };
                logAction(logReq, 'LOGIN', 'Success');

                return res.status(200).json({ user_id: user.id, username: user.username, role: user.role, token });
            }
        }
        return res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    } finally {
        if (conn) conn.release();
    }
};
