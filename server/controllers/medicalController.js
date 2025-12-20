const { pool } = require('../db');
const { logAction } = require('../utils/audit');

// --- Prescriptions ---

exports.createPrescription = async (req, res) => {
    let conn;
    try {
        const { appointment_id, medications, instructions } = req.body;
        // Verify doctor owns the appointment
        conn = await pool.getConnection();

        // Check appointment ownership
        const appt = await conn.query("SELECT doctor_id FROM appointments WHERE id = ?", [appointment_id]);
        if (appt.length === 0) return res.status(404).send("Appointment not found");

        // Verify user is the doctor of this appointment
        // We need to match req.user.user_id -> doctor_id
        const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);
        if (docInfo.length === 0 || docInfo[0].id !== appt[0].doctor_id) {
            return res.status(403).send("Unauthorized");
        }

        await conn.query(
            "INSERT INTO prescriptions (appointment_id, medications, instructions) VALUES (?, ?, ?)",
            [appointment_id, medications, instructions]
        );

        // Fetch details for readable log
        const details = await conn.query(`
            SELECT p.full_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?`, [appointment_id]);

        const patientName = details.length > 0 ? details[0].full_name : 'Unknown Patient';

        logAction(req, 'CREATE_PRESCRIPTION', `Patient: ${patientName}`);

        res.status(201).send("Prescription created");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getPrescriptions = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        conn = await pool.getConnection();
        let query = `SELECT pr.*, a.appointment_date, d.full_name as doctor_name, p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address 
                     FROM prescriptions pr
                     JOIN appointments a ON pr.appointment_id = a.id
                     JOIN doctors d ON a.doctor_id = d.id
                     JOIN patients p ON a.patient_id = p.id`;
        let params = [];

        if (role === 'patient') {
            const patInfo = await conn.query("SELECT id FROM patients WHERE user_id = ?", [user_id]);
            if (patInfo.length > 0) {
                query += " WHERE a.patient_id = ?";
                params.push(patInfo[0].id);
            }
        }
        // Doctors see all they wrote? Or all for their patients? Let's say all they wrote for now.
        else if (role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docInfo.length > 0) {
                query += " WHERE a.doctor_id = ?";
                params.push(docInfo[0].id);
            }
        }

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// --- Medical Licenses ---

exports.createLicense = async (req, res) => {
    let conn;
    try {
        const { appointment_id, start_date, days_duration, diagnosis } = req.body;
        conn = await pool.getConnection();

        // Check appointment ownership (Same logic as prescription)
        const appt = await conn.query("SELECT doctor_id FROM appointments WHERE id = ?", [appointment_id]);
        if (appt.length === 0) return res.status(404).send("Appointment not found");

        const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);
        if (docInfo.length === 0 || docInfo[0].id !== appt[0].doctor_id) {
            return res.status(403).send("Unauthorized");
        }

        await conn.query(
            "INSERT INTO medical_licenses (appointment_id, start_date, days_duration, diagnosis) VALUES (?, ?, ?, ?)",
            [appointment_id, start_date, days_duration, diagnosis]
        );

        // Fetch details for readable log
        const details = await conn.query(`
            SELECT p.full_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?`, [appointment_id]);

        const patientName = details.length > 0 ? details[0].full_name : 'Unknown Patient';

        logAction(req, 'CREATE_LICENSE', `Patient: ${patientName}, Duration: ${days_duration} days`);

        res.status(201).send("License created");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getLicenses = async (req, res) => {
    // Similar logic to prescriptions
    let conn;
    try {
        const { role, user_id } = req.user;
        conn = await pool.getConnection();
        let query = `SELECT ml.*, a.appointment_date, d.full_name as doctor_name, p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address 
                     FROM medical_licenses ml
                     JOIN appointments a ON ml.appointment_id = a.id
                     JOIN doctors d ON a.doctor_id = d.id
                     JOIN patients p ON a.patient_id = p.id`;
        let params = [];

        if (role === 'patient') {
            const patInfo = await conn.query("SELECT id FROM patients WHERE user_id = ?", [user_id]);
            if (patInfo.length > 0) {
                query += " WHERE a.patient_id = ?";
                params.push(patInfo[0].id);
            }
        } else if (role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docInfo.length > 0) {
                query += " WHERE a.doctor_id = ?";
                params.push(docInfo[0].id);
            }
        }

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// Requests
exports.createRequest = async (req, res) => {
    let conn;
    try {
        const { type, patient_id, doctor_id, request_note } = req.body;
        const secretary_id = req.user.user_id;

        conn = await pool.getConnection();
        await conn.query(
            "INSERT INTO medical_requests (type, patient_id, doctor_id, secretary_id, request_note) VALUES (?, ?, ?, ?, ?)",
            [type, patient_id, doctor_id, secretary_id, request_note]
        );
        logAction(req, 'CREATE_MEDICAL_REQUEST', `Type: ${type}, Patient ID: ${patient_id}`);
        res.status(201).json({ message: "Request created" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getRequests = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        let query = `
            SELECT r.*, 
            p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address, p.user_id as patient_user_id, 
            d.full_name as doctor_name, 
            s.username as secretary_name,
            (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.request_id = r.id AND t.status = 'pending') as debt_amount,
            (SELECT method FROM transactions t WHERE t.request_id = r.id AND t.status = 'paid' LIMIT 1) as payment_method
            FROM medical_requests r
            JOIN patients p ON r.patient_id = p.id
            JOIN doctors d ON r.doctor_id = d.id
            LEFT JOIN users s ON r.secretary_id = s.id
        `;
        let params = [];

        if (role === 'doctor') {
            conn = await pool.getConnection();
            const doc = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (doc.length > 0) {
                query += " WHERE r.doctor_id = ?";
                params.push(doc[0].id);
            }
        }

        query += " ORDER BY r.created_at DESC";

        if (!conn) conn = await pool.getConnection();
        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateRequestStatus = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { status, doctor_note } = req.body;

        conn = await pool.getConnection();
        await conn.query("UPDATE medical_requests SET status = ?, doctor_note = ? WHERE id = ?", [status, doctor_note, id]);

        logAction(req, 'UPDATE_MEDICAL_REQUEST', `Request ${id} updated to ${status}`);
        res.json({ message: "Request updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }

};

exports.updateRequestPaymentStatus = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { status } = req.body;
        conn = await pool.getConnection();
        await conn.query("UPDATE medical_requests SET payment_status = ? WHERE id = ?", [status, id]);
        res.json({ message: "Payment status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// Files
exports.uploadFile = async (req, res) => {
    let conn;
    try {
        if (!req.file) return res.status(400).send("No file uploaded");

        const { patient_id, description } = req.body;
        const uploaded_by = req.user.user_id;
        const file_url = `/uploads/${req.file.filename}`;
        const file_name = req.file.originalname;
        const file_type = req.file.mimetype;

        conn = await pool.getConnection();
        await conn.query(
            "INSERT INTO patient_files (patient_id, uploaded_by, file_name, file_url, file_type, description) VALUES (?, ?, ?, ?, ?, ?)",
            [patient_id, uploaded_by, file_name, file_url, file_type, description]
        );

        logAction(req, 'UPLOAD_FILE', `File: ${file_name} for Patient ID: ${patient_id}`);
        res.status(201).json({ message: "File uploaded" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getPatientFiles = async (req, res) => {
    let conn;
    try {
        const { patient_id } = req.query;

        let query = `
            SELECT f.*, u.username as uploader_name, p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address
            FROM patient_files f
            JOIN users u ON f.uploaded_by = u.id
            JOIN patients p ON f.patient_id = p.id
        `;
        let params = [];

        if (patient_id) {
            query += " WHERE f.patient_id = ?";
            params.push(patient_id);
        }

        query += " ORDER BY f.created_at DESC";

        conn = await pool.getConnection();
        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
