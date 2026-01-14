const { pool } = require('../db');
const crypto = require('crypto');

// Generate a random token
const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Generate Access Token (Called by Secretary)
exports.generateToken = async (req, res) => {
    const { patientId } = req.body;
    const token = generateRandomToken();
    const expiresInMinutes = 30;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

    let conn;
    try {
        conn = await pool.getConnection();

        // If patientId is provided, check if it exists
        if (patientId) {
            const patients = await conn.query("SELECT id FROM patients WHERE id = ?", [patientId]);
            if (!patients || patients.length === 0) {
                return res.status(404).json({ error: "Patient not found" });
            }
        }

        // Insert token
        await conn.query(
            "INSERT INTO patient_access_tokens (token, patient_id, expires_at) VALUES (?, ?, ?)",
            [token, patientId || null, expiresAt]
        );

        // Return token and URL (Client will construct full URL)
        res.json({
            token,
            expiresAt,
            url: `/patient-access/${token}`
        });

    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ error: "Failed to generate access token" });
    } finally {
        if (conn) conn.release();
    }
};

// Verify Token (Called by Patient Device)
exports.verifyToken = async (req, res) => {
    const { token } = req.params;
    console.log('🔍 Verifying token:', token);
    let conn;
    try {
        conn = await pool.getConnection();
        const records = await conn.query(
            "SELECT * FROM patient_access_tokens WHERE token = ? AND expires_at > NOW()",
            [token]
        );

        console.log('🔍 Database records found:', records.length);

        if (!records || records.length === 0) {
            console.log('⚠️ Token not found or expired in DB');
            return res.status(404).json({ message: 'Token inválido o expirado' });
        }

        const data = records[0];
        if (!data) {
            return res.status(404).json({ message: 'Token no encontrado' });
        }

        let patientData = null;
        if (data.patient_id) {
            const patients = await conn.query(`
                SELECT p.*, u.username
                FROM patients p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?`,
                [data.patient_id]
            );
            if (patients && patients.length > 0) {
                patientData = patients[0];
            }
        }

        res.json({
            valid: true,
            isNew: !data.patient_id,
            patient: patientData
        });

    } catch (error) {
        console.error("❌ Error verifying token:", error);
        res.status(500).json({ error: "Failed to verify token" });
    } finally {
        if (conn) conn.release();
    }
};

// Complete/Update Profile (Called by Patient Device)
exports.completeProfile = async (req, res) => {
    const { token } = req.params;
    const formData = req.body;
    let conn;

    try {
        conn = await pool.getConnection();

        const records = await conn.query(
            "SELECT * FROM patient_access_tokens WHERE token = ? AND expires_at > NOW()",
            [token]
        );

        if (!records || records.length === 0) {
            return res.status(403).json({ error: "Token expired or invalid" });
        }

        const data = records[0];

        if (data.patient_id) {
            // Update Existing Patient
            await conn.query(`
                UPDATE patients SET 
                    full_name = ?, phone = ?, email = ?, address = ?, 
                    dob = ?, insurance_id = ?, affiliate_number = ?, 
                    medical_history = ?
                WHERE id = ?`,
                [
                    formData.full_name,
                    formData.phone,
                    formData.email,
                    formData.address,
                    formData.dob ? formData.dob : null,
                    formData.insurance_id ? formData.insurance_id : null,
                    formData.affiliate_number,
                    formData.medical_history,
                    data.patient_id
                ]
            );
        } else {
            // Create New Patient
            // Check if username exists
            const existingUsers = await conn.query("SELECT id FROM users WHERE username = ?", [formData.username]);
            if (existingUsers && existingUsers.length > 0) {
                return res.status(400).json({ error: "Username already taken" });
            }

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(formData.password, 10);

            const resultUser = await conn.query(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'patient')",
                [formData.username, hashedPassword]
            );
            const userId = resultUser.insertId;

            // 2. Create Patient Record
            await conn.query(`
                INSERT INTO patients (
                    user_id, full_name, dni, phone, email, address, dob, 
                    insurance_id, affiliate_number, behavior_rating
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5)`,
                [
                    userId,
                    formData.full_name,
                    formData.dni,
                    formData.phone,
                    formData.email,
                    formData.address,
                    formData.dob ? formData.dob : null,
                    formData.insurance_id ? formData.insurance_id : null,
                    formData.affiliate_number
                ]
            );
        }

        // Invalidate token
        await conn.query("DELETE FROM patient_access_tokens WHERE id = ?", [data.id]);

        res.json({ success: true, message: "Profile updated successfully" });

    } catch (error) {
        console.error("Error completing profile:", error);
        res.status(500).json({ error: "Failed to save profile" });
    } finally {
        if (conn) conn.release();
    }
};
