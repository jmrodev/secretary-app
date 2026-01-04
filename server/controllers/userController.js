const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');
const googleController = require('./googleController');

exports.getProfile = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        conn = await pool.getConnection();

        // Fetch profile based on role
        let query;
        if (role === 'admin') {
            // Admin might not have a separate profile table, or just basic info
            return res.json({ role, user_id, username: 'Admin' });
        } else if (role === 'secretary') {
            query = "SELECT * FROM secretaries WHERE user_id = ?";
        } else if (role === 'doctor') {
            query = "SELECT * FROM doctors WHERE user_id = ?";
        } else if (role === 'patient') {
            query = "SELECT * FROM patients WHERE user_id = ?";
        }

        const rows = await conn.query(query, [user_id]);
        if (rows.length > 0) {
            res.json({ ...rows[0], role });
        } else {
            res.status(404).send("Profile not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getAllDoctors = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, user_id, full_name, specialty, phone, office_number, rental_type, rental_cost, consultation_price, prescription_price, medical_license_price, virtual_consultation_price FROM doctors");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getAllPatients = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Calculate total_debt for each patient
        // Also fetch total appointments and missed/cancelled ones (for attendance rating)
        const query = `
            SELECT p.*, 
            (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.related_user_id = p.user_id AND t.status = 'pending') as total_debt,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status IN ('cancelled', 'missed')) as missed_appointments
            FROM patients p
        `;
        const rows = await conn.query(query);
        // Serialize BigInts
        const serialized = rows.map(r => ({
            ...r,
            total_debt: Number(r.total_debt),
            total_appointments: Number(r.total_appointments),
            missed_appointments: Number(r.missed_appointments)
        }));
        res.json(serialized);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getPatientDetails = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        console.log(`[getPatientDetails] Request for ID: ${id}`);
        conn = await pool.getConnection();

        // 1. Get Basic Info
        const patientRows = await conn.query("SELECT * FROM patients WHERE id = ?", [id]);
        if (patientRows.length === 0) return res.status(404).send("Patient not found");
        const patient = patientRows[0];

        // 2. Get History (Appointments)
        const apps = await conn.query(`
            SELECT a.*, d.full_name as doctor_name 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            WHERE a.patient_id = ? 
            ORDER BY a.appointment_date DESC`,
            [id]
        );

        // 3. Get Prescriptions
        const pres = await conn.query(`
            SELECT p.*, d.full_name as doctor_name 
            FROM prescriptions p
            JOIN appointments a ON p.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?`,
            [id]
        );

        // 4. Get Uploaded Files
        const files = await conn.query(`
            SELECT f.*, u.username as uploader_name 
            FROM patient_files f
            JOIN users u ON f.uploaded_by = u.id
            WHERE f.patient_id = ? 
            ORDER BY f.created_at DESC`,
            [id]
        );

        // 5. Get Accumulated License Days
        const licenseStats = await conn.query(`
            SELECT COALESCE(SUM(ml.days_duration), 0) as total_days
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
            WHERE a.patient_id = ?`,
            [id]
        );

        res.json({
            ...patient,
            appointments: apps,
            prescriptions: pres,
            files: files,
            accumulated_days: Number(licenseStats[0].total_days)
        });


    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateProfile = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        const updates = req.body;

        console.log(`Updating profile for user ${user_id} (${role})`, updates);

        conn = await pool.getConnection();
        let query = "";
        let params = [];

        if (role === 'patient') {
            let fields = [];
            if (updates.full_name !== undefined) { fields.push("full_name = ?"); params.push(updates.full_name); }
            if (updates.phone !== undefined) { fields.push("phone = ?"); params.push(updates.phone); }
            if (updates.address !== undefined) { fields.push("address = ?"); params.push(updates.address); }
            if (updates.medical_history !== undefined) { fields.push("medical_history = ?"); params.push(updates.medical_history); }

            if (fields.length > 0) {
                query = `UPDATE patients SET ${fields.join(', ')} WHERE user_id = ?`;
                params.push(user_id);
            }
        } else if (role === 'doctor') {
            let fields = [];
            if (updates.full_name !== undefined) { fields.push("full_name = ?"); params.push(updates.full_name); }
            if (updates.phone !== undefined) { fields.push("phone = ?"); params.push(updates.phone); }
            if (updates.specialty !== undefined) { fields.push("specialty = ?"); params.push(updates.specialty); }
            if (updates.cbu !== undefined) { fields.push("cbu = ?"); params.push(updates.cbu); }
            if (updates.consultation_price !== undefined) { fields.push("consultation_price = ?"); params.push(updates.consultation_price); }
            if (updates.office_number !== undefined) { fields.push("office_number = ?"); params.push(updates.office_number); }
            if (updates.rental_type !== undefined) { fields.push("rental_type = ?"); params.push(updates.rental_type); }
            if (updates.rental_cost !== undefined) { fields.push("rental_cost = ?"); params.push(updates.rental_cost); }
            if (fields.length > 0) {
                query = `UPDATE doctors SET ${fields.join(', ')} WHERE user_id = ?`;
                params.push(user_id);
            }
        } else if (role === 'secretary') {
            let fields = [];
            if (updates.full_name !== undefined) { fields.push("full_name = ?"); params.push(updates.full_name); }
            if (updates.phone !== undefined) { fields.push("phone = ?"); params.push(updates.phone); }
            if (fields.length > 0) {
                query = `UPDATE secretaries SET ${fields.join(', ')} WHERE user_id = ?`;
                params.push(user_id);
            }
        }

        if (query) {
            console.log("Executing query:", query, params);
            await conn.query(query, params);
            res.send("Profile updated successfully");
        } else {
            console.log("No valid fields to update found in:", updates);
            res.status(400).send("No valid fields to update");
        }

    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

exports.getUsersForAdmin = async (req, res) => {
    let conn;
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Unauthorized");

        conn = await pool.getConnection();
        const users = await conn.query(`
            SELECT id, username, role, created_at,
            CASE 
                WHEN role = 'patient' THEN (SELECT full_name FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT full_name FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT full_name FROM secretaries WHERE user_id = users.id)
                ELSE 'System'
            END as full_name,

            CASE
                WHEN role = 'patient' THEN (SELECT dni FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT dni FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT dni FROM secretaries WHERE user_id = users.id)
                ELSE NULL
            END as dni,

            CASE
                WHEN role = 'patient' THEN (SELECT phone FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT phone FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT phone FROM secretaries WHERE user_id = users.id)
                ELSE NULL
            END as phone,

            CASE
                WHEN role = 'doctor' THEN (SELECT specialty FROM doctors WHERE user_id = users.id)
                ELSE NULL
            END as specialty

            FROM users
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.adminResetPassword = async (req, res) => {
    let conn;
    try {
        console.log("Admin Reset Password Request:", req.params, req.body);
        if (req.user.role !== 'admin') return res.status(403).send("Unauthorized");
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            console.error("Missing newPassword");
            return res.status(400).send("Password required");
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log("Password hashed");

        conn = await pool.getConnection();
        // Increment token_version to invalidate old tokens
        await conn.query("UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?", [hashedPassword, id]);
        console.log("DB Updated & Token Version Incremented");

        logAction(req, 'ADMIN_RESET_PASSWORD', `Reset password for User ID: ${id}`);
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

exports.updatePatientDetails = async (req, res) => {
    let conn;
    try {
        const { id } = req.params; // patients.id
        const updates = req.body;
        console.log(`[updatePatientDetails] Updating patient ${id}`, updates);

        conn = await pool.getConnection();

        let fields = [];
        let params = [];

        if (updates.full_name !== undefined) { fields.push("full_name = ?"); params.push(updates.full_name); }
        if (updates.dni !== undefined) { fields.push("dni = ?"); params.push(updates.dni); }
        if (updates.phone !== undefined) { fields.push("phone = ?"); params.push(updates.phone); }
        if (updates.insurance !== undefined) { fields.push("insurance = ?"); params.push(updates.insurance); }
        if (updates.dob !== undefined) { fields.push("dob = ?"); params.push(updates.dob); }
        if (updates.address !== undefined) { fields.push("address = ?"); params.push(updates.address); }
        if (updates.medical_history !== undefined) { fields.push("medical_history = ?"); params.push(updates.medical_history); }
        if (updates.tariff_percent !== undefined) { fields.push("tariff_percent = ?"); params.push(updates.tariff_percent); }
        if (updates.tariff_override !== undefined) { fields.push("tariff_override = ?"); params.push(updates.tariff_override === '' ? null : updates.tariff_override); }
        if (updates.behavior_rating !== undefined) { fields.push("behavior_rating = ?"); params.push(updates.behavior_rating); }

        if (fields.length > 0) {
            const query = `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);
            await conn.query(query, params);

            // Fetch updated patient data for sync
            const [updatedPatient] = await conn.query("SELECT * FROM patients WHERE id = ?", [id]);
            if (updatedPatient) {
                // Fire and forget sync
                googleController.syncContact(updatedPatient).catch(err => console.error("Async Sync Error:", err));
            }

            res.json({ message: "Patient updated successfully" });
        } else {
            res.status(400).send("No valid fields");
        }
    } catch (err) {
        console.error("Update Patient Error:", err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateDoctor = async (req, res) => {
    let conn;
    try {
        const { id } = req.params; // doctors.id
        const updates = req.body;
        console.log(`[updateDoctor] Updating doctor ${id}`, updates);

        if (req.user.role !== 'admin' && req.user.role !== 'secretary') {
            return res.status(403).send("Unauthorized");
        }

        conn = await pool.getConnection();

        let fields = [];
        let params = [];

        if (updates.full_name !== undefined) { fields.push("full_name = ?"); params.push(updates.full_name); }
        if (updates.specialty !== undefined) { fields.push("specialty = ?"); params.push(updates.specialty); }
        if (updates.phone !== undefined) { fields.push("phone = ?"); params.push(updates.phone); }
        if (updates.office_number !== undefined) { fields.push("office_number = ?"); params.push(updates.office_number); }
        if (updates.rental_type !== undefined) { fields.push("rental_type = ?"); params.push(updates.rental_type); }
        if (updates.rental_cost !== undefined) { fields.push("rental_cost = ?"); params.push(updates.rental_cost); }
        if (updates.consultation_price !== undefined) { fields.push("consultation_price = ?"); params.push(updates.consultation_price); }
        if (updates.prescription_price !== undefined) { fields.push("prescription_price = ?"); params.push(updates.prescription_price); }
        if (updates.medical_license_price !== undefined) { fields.push("medical_license_price = ?"); params.push(updates.medical_license_price); }
        if (updates.virtual_consultation_price !== undefined) { fields.push("virtual_consultation_price = ?"); params.push(updates.virtual_consultation_price); }

        if (fields.length > 0) {
            const query = `UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);
            await conn.query(query, params);
            res.json({ message: "Doctor updated successfully" });
        } else {
            res.status(400).send("No valid fields");
        }
    } catch (err) {
        console.error("Update Doctor Error:", err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.createUser = async (req, res) => {
    let conn;
    try {
        const { username, password, role, fullName, dni, email, phone, specialty, extraData } = req.body;

        if (!username || !password || !role) {
            return res.status(400).send("Missing required fields");
        }

        conn = await pool.getConnection();

        // Start Transaction
        await conn.beginTransaction();

        const exists = await conn.query("SELECT id FROM users WHERE username = ?", [username]);
        if (exists.length > 0) {
            await conn.release(); // release before return to be safe, though finally handles it if check is outside transaction?
            // Actually, we are in transaction, so we should commit or rollback? 
            // Read-only op doesn't strictly need rollback but good practice to release consistently.
            // Let's just return 409 and let finally release. Rolling back a read-only is fine.
            await conn.rollback();
            return res.status(409).send("User already exists");
        }

        const hash = await bcrypt.hash(password, 10);
        const resUser = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [username, hash, role]);
        const userId = Number(resUser.insertId);

        if (role === 'doctor') {
            await conn.query("INSERT INTO doctors (user_id, full_name, dni, specialty, phone) VALUES (?, ?, ?, ?, ?)",
                [userId, fullName, dni || null, specialty || null, phone || null]);
        } else if (role === 'secretary') {
            await conn.query("INSERT INTO secretaries (user_id, full_name, dni, phone) VALUES (?, ?, ?, ?)",
                [userId, fullName, dni || null, phone || null]);
        } else if (role === 'patient') {
            await conn.query("INSERT INTO patients (user_id, full_name, dni, phone) VALUES (?, ?, ?, ?)",
                [userId, fullName, dni || null, phone || null]);

            // Sync new patient to Google (Async - outside transaction critical path?)
            // If this fails, should we fail user creation? Probably not.
            googleController.syncContact({ full_name: fullName, dni, phone }).catch(err => console.error("Async Sync Error:", err));
        }

        await conn.commit();

        logAction(req, 'ADMIN_CREATE_USER', `Created user ${username} (${role})`);
        res.status(201).json({ message: "User created", userId });

    } catch (err) {
        if (conn) await conn.rollback(); // Rollback on error
        console.error("Create User Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

exports.updateUser = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { username, role, full_name, dni, phone, specialty } = req.body;

        conn = await pool.getConnection();

        await conn.query("UPDATE users SET username = ?, role = ? WHERE id = ?", [username, role, id]);

        if (role === 'doctor') {
            await conn.query("UPDATE doctors SET full_name = ?, dni = ?, phone = ?, specialty = ? WHERE user_id = ?",
                [full_name, dni, phone, specialty, id]);
        } else if (role === 'secretary') {
            await conn.query("UPDATE secretaries SET full_name = ?, dni = ?, phone = ? WHERE user_id = ?",
                [full_name, dni, phone, id]);
        } else if (role === 'patient') {
            await conn.query("UPDATE patients SET full_name = ?, dni = ?, phone = ? WHERE user_id = ?",
                [full_name, dni, phone, id]);
        }

        logAction(req, 'ADMIN_UPDATE_USER', `Updated user ${id}`);
        res.json({ message: "User updated" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteUser = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();

        // Check if user exists first to log username? Optional.
        // Assuming cascade delete is handled or we rely on cleaning up manually if needed. 
        // For strictly safe deletions, we should delete from profile tables first if no cascade.
        // Current schema likely has user_id FK. If ON DELETE RESTRICT, this will fail.
        // Let's attempt delete from users. If it fails due to constraint, we assume we need to delete children first.
        // Usually clinical apps don't hard delete patients with data. Soft delete is better.
        // But user asked for CRUD. Hard delete for now.

        // Let's try to delete from related tables first just in case.
        await conn.query("DELETE FROM doctors WHERE user_id = ?", [id]);
        await conn.query("DELETE FROM secretaries WHERE user_id = ?", [id]);
        await conn.query("DELETE FROM patients WHERE user_id = ?", [id]);

        await conn.query("DELETE FROM users WHERE id = ?", [id]);

        logAction(req, 'ADMIN_DELETE_USER', `Deleted user ${id}`);
        res.json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
