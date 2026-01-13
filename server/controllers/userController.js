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
        const rows = await conn.query("SELECT id, user_id, full_name, specialty, phone, office_number, rental_type, rental_cost, consultation_price, prescription_price, medical_license_price, virtual_consultation_price, default_visit_interval_days, default_prescription_interval_days FROM doctors");
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
        const { search } = req.query;
        const { role, user_id } = req.user;

        if (role === 'patient') {
            return res.status(403).send("Unauthorized");
        }

        let query = `
            SELECT p.*, i.name as insurance_name,
            (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.related_user_id = p.user_id AND t.status = 'pending') as total_debt,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status IN ('cancelled', 'missed')) as missed_appointments
            FROM patients p
            LEFT JOIN insurances i ON p.insurance_id = i.id
        `;

        let params = [];
        let conditions = [];

        // If Doctor, filter by assigned patients
        if (role === 'doctor') {
            // Get doctor_id from user_id first
            const [docRows] = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docRows.length > 0) {
                const doctorId = docRows[0].id;
                // Join or subquery. Join is cleaner but we started with simple select.
                // Let's add INNER JOIN patient_doctors pd ON p.id = pd.patient_id WHERE pd.doctor_id = ?
                query = `
                    SELECT p.*, 
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.related_user_id = p.user_id AND t.status = 'pending') as total_debt,
                    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
                    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status IN ('cancelled', 'missed')) as missed_appointments
                    FROM patients p
                    INNER JOIN patient_doctors pd ON p.id = pd.patient_id
                `;
                conditions.push("pd.doctor_id = ?");
                params.push(doctorId);
            }
        }

        if (search) {
            const searchTerm = `%${search}%`;
            conditions.push("(p.full_name LIKE ? OR p.dni LIKE ? OR p.address LIKE ? OR p.phone LIKE ?)");
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        const rows = await conn.query(query, params);
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
        const patientRows = await conn.query(`
            SELECT p.*, i.name as insurance_name 
            FROM patients p 
            LEFT JOIN insurances i ON p.insurance_id = i.id 
            WHERE p.id = ?`, [id]);
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
        // 3. Get Prescriptions & Licenses (Combined)
        const pres = await conn.query(`
            (SELECT 
                p.id, 
                p.created_at, 
                'prescription' as type, 
                d.full_name as doctor_name,
                p.medications as diagnosis, 
                NULL as days
            FROM prescriptions p
            JOIN appointments a ON p.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?)
            UNION
            (SELECT 
                ml.id, 
                ml.created_at, 
                'license' as type, 
                d.full_name as doctor_name,
                ml.diagnosis, 
                ml.days_duration as days
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?)
            ORDER BY created_at DESC`,
            [id, id]
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

        // 6. Get Assigned Doctors
        const assignedDocs = await conn.query(`
            SELECT d.id, d.full_name 
            FROM patient_doctors pd
            JOIN doctors d ON pd.doctor_id = d.id
            WHERE pd.patient_id = ?
        `, [id]);

        res.json({
            ...patient,
            appointments: apps,
            prescriptions: pres,
            files: files,
            accumulated_days: Number(licenseStats[0].total_days),
            assignedDoctors: assignedDocs
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
            // New fields
            if (updates.insurance_id !== undefined) { fields.push("insurance_id = ?"); params.push(updates.insurance_id === '' ? null : updates.insurance_id); }
            if (updates.affiliate_number !== undefined) { fields.push("affiliate_number = ?"); params.push(updates.affiliate_number); }

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
            if (updates.default_visit_interval_days !== undefined) { fields.push("default_visit_interval_days = ?"); params.push(updates.default_visit_interval_days); }
            if (updates.default_prescription_interval_days !== undefined) { fields.push("default_prescription_interval_days = ?"); params.push(updates.default_prescription_interval_days); }
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
            WHERE role != 'patient'
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
        // if (updates.insurance !== undefined) { fields.push("insurance = ?"); params.push(updates.insurance); } // REMOVED/DEPRECATED
        if (updates.insurance_id !== undefined) { fields.push("insurance_id = ?"); params.push(updates.insurance_id === '' ? null : updates.insurance_id); }
        if (updates.affiliate_number !== undefined) { fields.push("affiliate_number = ?"); params.push(updates.affiliate_number); }

        if (updates.dob !== undefined) { fields.push("dob = ?"); params.push(updates.dob); }
        if (updates.address !== undefined) { fields.push("address = ?"); params.push(updates.address); }
        if (updates.medical_history !== undefined) { fields.push("medical_history = ?"); params.push(updates.medical_history); }
        if (updates.tariff_percent !== undefined) { fields.push("tariff_percent = ?"); params.push(updates.tariff_percent); }
        if (updates.tariff_override !== undefined) { fields.push("tariff_override = ?"); params.push(updates.tariff_override === '' ? null : updates.tariff_override); }
        if (updates.behavior_rating !== undefined) { fields.push("behavior_rating = ?"); params.push(updates.behavior_rating); }
        if (updates.visit_interval_days !== undefined) { fields.push("visit_interval_days = ?"); params.push(updates.visit_interval_days === '' ? null : updates.visit_interval_days); }
        if (updates.prescription_interval_days !== undefined) { fields.push("prescription_interval_days = ?"); params.push(updates.prescription_interval_days === '' ? null : updates.prescription_interval_days); }
        if (updates.next_suggested_visit_date !== undefined) { fields.push("next_suggested_visit_date = ?"); params.push(updates.next_suggested_visit_date === '' ? null : updates.next_suggested_visit_date); }
        if (updates.next_suggested_prescription_date !== undefined) { fields.push("next_suggested_prescription_date = ?"); params.push(updates.next_suggested_prescription_date === '' ? null : updates.next_suggested_prescription_date); }
        if (updates.license_expiry_date !== undefined) { fields.push("license_expiry_date = ?"); params.push(updates.license_expiry_date === '' ? null : updates.license_expiry_date); }

        if (fields.length > 0) {
            const query = `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);
            await conn.query(query, params);
        }

        if (updates.assignedDoctors !== undefined) {
            // Expecting updates.assignedDoctors to be an array of doctor IDs
            // Strategy: Delete all for this patient and re-insert? Or diff?
            // Delete all is simpler and safe enough for this scale.
            await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [id]);

            if (Array.isArray(updates.assignedDoctors) && updates.assignedDoctors.length > 0) {
                const insertValues = updates.assignedDoctors.map(docId => [id, docId]);
                // Bulk insert
                await conn.batch("INSERT INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", insertValues);
            }
        }

        if (fields.length > 0 || updates.assignedDoctors !== undefined) {


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
        if (updates.certificate_price !== undefined) { fields.push("certificate_price = ?"); params.push(updates.certificate_price); }
        if (updates.default_visit_interval_days !== undefined) { fields.push("default_visit_interval_days = ?"); params.push(updates.default_visit_interval_days); }
        if (updates.default_prescription_interval_days !== undefined) { fields.push("default_prescription_interval_days = ?"); params.push(updates.default_prescription_interval_days); }

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

exports.getReminders = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        conn = await pool.getConnection();

        let doctorId = null;
        if (role === 'doctor') {
            const [docRows] = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docRows.length > 0) doctorId = docRows[0].id;
        }

        const query = `
            SELECT p.id, p.full_name, p.phone, p.dni,
            d.full_name as doctor_name,
            p.next_suggested_visit_date,
            p.next_suggested_prescription_date,
            p.license_expiry_date
            FROM patients p
            INNER JOIN patient_doctors pd ON p.id = pd.patient_id
            INNER JOIN doctors d ON pd.doctor_id = d.id
            WHERE 
                (p.next_suggested_visit_date IS NOT NULL AND p.next_suggested_visit_date <= CURRENT_DATE)
                OR (p.next_suggested_prescription_date IS NOT NULL AND p.next_suggested_prescription_date <= CURRENT_DATE)
                OR (p.license_expiry_date IS NOT NULL AND p.license_expiry_date <= CURRENT_DATE)
        `;

        let finalQuery = query;
        let params = [];
        if (doctorId) {
            finalQuery += " AND pd.doctor_id = ?";
            params.push(doctorId);
        }

        const rows = await conn.query(finalQuery, params);
        res.json(rows);
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

        // 1. Get user role to know which specific tables to check (optional optimization, but good for logging)
        const [user] = await conn.query("SELECT username, role FROM users WHERE id = ?", [id]);
        if (!user) return res.status(404).json({ message: "User not found" });

        console.log(`[deleteUser] Deleting user ${id} (${user.username}, ${user.role}) and all related data...`);

        // Start Transaction
        await conn.beginTransaction();

        try {
            // 2. Identify Patient/Doctor ID if applicable
            let patientId = null;
            let doctorId = null;

            if (user.role === 'patient') {
                const [p] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [id]);
                if (p) patientId = p.id;
            } else if (user.role === 'doctor') {
                const [d] = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [id]);
                if (d) doctorId = d.id;
            }

            // 3. Delete from Related Tables (Order matters for FKs)

            // Shared: Audit Logs & Files Uploaded & Transactions
            await conn.query("DELETE FROM audit_logs WHERE user_id = ?", [id]);
            await conn.query("DELETE FROM patient_files WHERE uploaded_by = ?", [id]); // Files uploaded BY this user
            await conn.query("DELETE FROM transactions WHERE related_user_id = ?", [id]); // Financials linked to user

            if (patientId) {
                console.log(`Deleting patient data for patient_id: ${patientId}`);
                // Delete Patient Specifics
                await conn.query("DELETE FROM patient_files WHERE patient_id = ?", [patientId]); // Files belonging TO patient
                await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [patientId]);
                await conn.query("DELETE FROM medical_requests WHERE patient_id = ?", [patientId]);

                // Appointments & Prescriptions
                // Need to delete prescriptions linked to appointments of this patient?
                // Or rely on ON DELETE CASCADE? Assuming manual cleanup for safety.
                await conn.query("DELETE FROM prescriptions WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id = ?)", [patientId]);
                await conn.query("DELETE FROM medical_licenses WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id = ?)", [patientId]);
                await conn.query("DELETE FROM appointments WHERE patient_id = ?", [patientId]);

                // Finally profile
                await conn.query("DELETE FROM patients WHERE id = ?", [patientId]);
            }

            if (doctorId) {
                console.log(`Deleting doctor data for doctor_id: ${doctorId}`);
                // Delete Doctor Specifics
                await conn.query("DELETE FROM patient_doctors WHERE doctor_id = ?", [doctorId]);

                // Appointments (Doc is provider) - This is DESTRUCTIVE to patient history.
                // We'll proceed as requested.
                await conn.query("DELETE FROM prescriptions WHERE appointment_id IN (SELECT id FROM appointments WHERE doctor_id = ?)", [doctorId]);
                await conn.query("DELETE FROM medical_licenses WHERE appointment_id IN (SELECT id FROM appointments WHERE doctor_id = ?)", [doctorId]);
                await conn.query("DELETE FROM appointments WHERE doctor_id = ?", [doctorId]);

                // Finally profile
                await conn.query("DELETE FROM doctors WHERE id = ?", [doctorId]);
            }

            if (user.role === 'secretary') {
                await conn.query("DELETE FROM secretaries WHERE user_id = ?", [id]);
            }

            // 4. Delete from USERS
            await conn.query("DELETE FROM users WHERE id = ?", [id]);

            await conn.commit();
            logAction(req, 'ADMIN_DELETE_USER', `Deleted user ${id} (${user.username})`);
            res.json({ message: "User deleted successfully" });

        } catch (error) {
            await conn.rollback();
            throw error;
        }

    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

exports.getStats = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        conn = await pool.getConnection();

        // Get current date boundaries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

        // Week boundaries (Monday to Sunday)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).toISOString().split('T')[0];
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 7).toISOString().split('T')[0];

        // Month boundaries
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

        let appointmentsToday, appointmentsWeek, appointmentsMonth, totalAppointments;
        let totalPatients, totalContacts;

        if (role === 'doctor') {
            const doctorRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (doctorRows.length === 0) return res.status(404).send("Doctor profile not found");
            const doctorId = doctorRows[0].id;

            const todayResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date < ?",
                [doctorId, todayStart, todayEnd]
            );
            appointmentsToday = Number(todayResult[0].count);

            const weekResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date < ?",
                [doctorId, weekStart, weekEnd]
            );
            appointmentsWeek = Number(weekResult[0].count);

            const monthResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date < ?",
                [doctorId, monthStart, monthEnd]
            );
            appointmentsMonth = Number(monthResult[0].count);

            const totalResult = await conn.query("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?", [doctorId]);
            totalAppointments = Number(totalResult[0].count);

            const patientsResult = await conn.query("SELECT COUNT(DISTINCT patient_id) as count FROM patient_doctors WHERE doctor_id = ?", [doctorId]);
            totalPatients = Number(patientsResult[0].count);

        } else {
            const todayResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND appointment_date < ?",
                [todayStart, todayEnd]
            );
            appointmentsToday = Number(todayResult[0].count);

            const weekResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND appointment_date < ?",
                [weekStart, weekEnd]
            );
            appointmentsWeek = Number(weekResult[0].count);

            const monthResult = await conn.query(
                "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND appointment_date < ?",
                [monthStart, monthEnd]
            );
            appointmentsMonth = Number(monthResult[0].count);

            const totalResult = await conn.query("SELECT COUNT(*) as count FROM appointments");
            totalAppointments = Number(totalResult[0].count);

            const patientsResult = await conn.query("SELECT COUNT(*) as count FROM patients");
            totalPatients = Number(patientsResult[0].count);
        }

        const contactsResult = await conn.query("SELECT COUNT(*) as count FROM patients");
        totalContacts = Number(contactsResult[0].count);

        res.json({
            appointments_today: appointmentsToday,
            appointments_week: appointmentsWeek,
            appointments_month: appointmentsMonth,
            total_appointments: totalAppointments,
            total_patients: totalPatients,
            total_contacts: totalContacts
        });

    } catch (err) {
        console.error("getStats Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};
