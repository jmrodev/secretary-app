const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logAction } = require('../utils/audit');

exports.register = async (req, res) => {
    let conn;
    try {
        let { username, password, role, fullName, phone, specialty, cbu, dob, address, medicalHistory, dni, insurance_id, institution_id, affiliate_number } = req.body;

        // Fallback for fullName if coming as full_name
        if (!fullName && req.body.full_name) {
            fullName = req.body.full_name;
        }

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

        let patientId = null;

        if (role === 'doctor') {
            await conn.query("INSERT INTO doctors (user_id, full_name, specialty, phone, cbu, dni) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, fullName, specialty || null, phone || null, cbu || null, dni || null]);
        } else if (role === 'secretary') {
            await conn.query("INSERT INTO secretaries (user_id, full_name, phone, dni) VALUES (?, ?, ?, ?)",
                [userId, fullName, phone || null, dni || null]);
        } else if (role === 'patient') {
            // fullName is required by logic, but we can also store split names if provided
            const firstName = req.body.first_name || fullName; // Fallback to fullName (as migrated data)
            const lastName = req.body.last_name || '';

            const pResult = await conn.query("INSERT INTO patients (user_id, full_name, first_name, last_name, dob, phone, address, medical_history, dni, insurance_id, institution_id, affiliate_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [userId, fullName, firstName, lastName, dob || null, phone || null, address || null, medicalHistory || null, dni || null, insurance_id || null, institution_id || null, affiliate_number || null]);
            patientId = pResult.insertId;

            // Handle Multiple Phone Numbers
            const phoneNumbers = req.body.phoneNumbers;
            if (Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
                let primaryPhone = '';
                for (const pn of phoneNumbers) {
                    await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                        ['patient', patientId, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']);
                    if (pn.is_primary) primaryPhone = pn.phone_number;
                }

                // If no primary was explicitly set, use the first one
                if (!primaryPhone && phoneNumbers.length > 0) {
                    primaryPhone = phoneNumbers[0].phone_number;
                }

                // Update legacy phone column if we found a primary number
                if (primaryPhone) {
                    await conn.query("UPDATE patients SET phone = ? WHERE id = ?", [primaryPhone, patientId]);
                }
            } else if (phone) {
                // If legacy phone was sent but no phoneNumbers array, ensure it's in the new table too
                await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                    ['patient', patientId, phone, 1, 'Celular']);
            }
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

        res.status(201).json({ user_id: userId, username, role, token, patient_id: patientId });
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

                // Match user against role-specific table to get full Name
                let name = user.username;
                try {
                    if (user.role === 'secretary') {
                        const sec = await conn.query("SELECT full_name FROM secretaries WHERE user_id = ?", [user.id]);
                        if (sec.length > 0) name = sec[0].full_name;
                    } else if (user.role === 'doctor') {
                        const doc = await conn.query("SELECT full_name FROM doctors WHERE user_id = ?", [user.id]);
                        if (doc.length > 0) name = doc[0].full_name;
                    } else if (user.role === 'patient') {
                        const pat = await conn.query("SELECT full_name FROM patients WHERE user_id = ?", [user.id]);
                        if (pat.length > 0) name = pat[0].full_name;
                    }
                } catch (e) {
                    console.error("Error fetching user detail name", e);
                }

                // Audit Log
                const logReq = { user: { user_id: user.id, username: user.username }, ip: req.ip };
                logAction(logReq, 'LOGIN', 'Success');

                return res.status(200).json({ user_id: user.id, username: user.username, role: user.role, token, name });
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
