const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const { saveToRecycleBin } = require('../utils/recycleBin');
const { calculatePrice } = require('../utils/priceCalculator');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// --- Vademecum & Patient Medications ---

exports.searchVademecum = async (req, res) => {
    let conn;
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);

        conn = await pool.getConnection();
        const searchTerms = q.trim().split(/\s+/).filter(t => t.length > 0);

        // Build a Boolean Mode string: +word* +word2*
        const booleanSearch = searchTerms.map(t => `+${t}*`).join(' ');

        // We combine Natural Language (for relevance) and Boolean Mode (for strictness) 
        // OR fallback to LIKE if terms are too short for FT index
        const query = `
            SELECT *, 
            MATCH(nombre, presentacion, monodroga, laboratorio) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
            FROM vademecum 
            WHERE MATCH(nombre, presentacion, monodroga, laboratorio) AGAINST(? IN BOOLEAN MODE)
            GROUP BY nombre, presentacion, monodroga, laboratorio
            ORDER BY relevance DESC, nombre ASC
            LIMIT 100
        `;

        let rows = await conn.query(query, [q, booleanSearch]);

        // If FT search returns nothing (usually because terms are too short or stopped words), 
        // fallback to the previous LIKE logic which is more permissive but slower
        if (rows.length === 0) {
            let fallbackQuery = "SELECT * FROM vademecum WHERE ";
            let conditions = [];
            let params = [];
            searchTerms.forEach(term => {
                conditions.push("(nombre LIKE ? OR presentacion LIKE ? OR monodroga LIKE ? OR laboratorio LIKE ?)");
                params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
            });
            fallbackQuery += conditions.join(" AND ") + " GROUP BY nombre, presentacion, monodroga, laboratorio LIMIT 100";
            rows = await conn.query(fallbackQuery, params);
        }

        res.json(rows.map(item => ({
            id: item.id,
            name: item.nombre,
            presentation: item.presentacion,
            drug: item.monodroga,
            lab: item.laboratorio,
            vademecum_type: item.vademecum_type,
            full_label: `${item.nombre} (${item.presentacion}) - ${item.monodroga} [${item.laboratorio}]`
        })));
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getPatientMedications = async (req, res) => {
    let conn;
    try {
        const { patientId } = req.params;
        conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM patient_medications WHERE patient_id = ? AND status = 'active' ORDER BY created_at DESC",
            [patientId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.addPatientMedication = async (req, res) => {
    let conn;
    try {
        const { patient_id, medication_name, presentation, monodroga, dose, frequency, is_chronic, next_refill_date, notes } = req.body;
        const added_by = req.user.user_id;

        conn = await pool.getConnection();
        await conn.query(
            "INSERT INTO patient_medications (patient_id, medication_name, presentation, monodroga, dose, frequency, is_chronic, added_by, next_refill_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [patient_id, medication_name, presentation, monodroga, dose, frequency, is_chronic ? 1 : 0, added_by, next_refill_date || null, notes || null]
        );

        res.status(201).json({ message: "Medication added to patient" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updatePatientMedication = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { dose, frequency, is_chronic, status } = req.body;

        conn = await pool.getConnection();
        await conn.query(
            "UPDATE patient_medications SET dose = ?, frequency = ?, is_chronic = ?, status = ? WHERE id = ?",
            [dose, frequency, is_chronic ? 1 : 0, status || 'active', id]
        );

        res.json({ message: "Patient medication updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deletePatientMedication = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        await conn.query("UPDATE patient_medications SET status = 'discontinued' WHERE id = ?", [id]);
        res.json({ message: "Medication discontinued" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// --- Prescriptions ---

exports.createPrescription = async (req, res) => {
    let conn;
    try {
        const { appointment_id, medications, instructions } = req.body;
        console.log("DEBUG: createPrescription called", { appointment_id, medications });

        if (!medications || !medications.trim()) {
            return res.status(400).send("Medications are required");
        }

        // Verify doctor owns the appointment
        conn = await pool.getConnection();

        // Check appointment ownership
        const appt = await conn.query("SELECT doctor_id FROM appointments WHERE id = ?", [appointment_id]);
        if (appt.length === 0) {
            console.log("DEBUG: Appointment not found");
            return res.status(404).send("Appointment not found");
        }

        // Verify user is the doctor of this appointment OR is Admin/Secretary
        if (req.user.role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);

            if (docInfo.length === 0) {
                console.log("DEBUG: Doctor profile not found for user", req.user.user_id);
                return res.status(403).send("Unauthorized");
            }

            console.log(`DEBUG: Checking match. UserDocID: ${docInfo[0].id}, ApptDocID: ${appt[0].doctor_id}`);

            if (docInfo[0].id !== appt[0].doctor_id) {
                console.log("DEBUG: Mismatch in doctor ownership");
                return res.status(403).send("Unauthorized");
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'secretary') {
            return res.status(403).send("Unauthorized");
        }

        await conn.query(
            "INSERT INTO prescriptions (appointment_id, medications, instructions) VALUES (?, ?, ?)",
            [appointment_id, medications, instructions]
        );

        console.log("DEBUG: Insert successful");

        // Fetch details for readable log
        const details = await conn.query(`
            SELECT p.full_name, p.id as patient_id, p.user_id as patient_user_id
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?`, [appointment_id]);

        const patientName = details.length > 0 ? details[0].full_name : 'Unknown Patient';

        // Calculate Debt
        if (details.length > 0) {
            const patientId = details[0].patient_id;
            const patientUserId = details[0].patient_user_id;
            const doctorId = appt[0].doctor_id;

            const { price } = await calculatePrice(conn, doctorId, patientId, 'prescription');

            if (price > 0) {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ['income_patient', price, `Prescription - ${instructions ? instructions.substring(0, 50) : 'General'}`, patientUserId, doctorId, 'credit', 'pending']
                );
                console.log(`DEBUG: Generated debt of $${price} for prescription`);
            }

            // --- REMINDER LOGIC: Update next suggested prescription date ---
            const [intervals] = await conn.query(`
                SELECT 
                    COALESCE(p.prescription_interval_days, d.default_prescription_interval_days) as interval_days
                FROM patients p
                JOIN patient_doctors pd ON p.id = pd.patient_id
                JOIN doctors d ON pd.doctor_id = d.id
                WHERE p.id = ? AND d.id = ?
            `, [patientId, doctorId]);

            if (intervals && intervals.interval_days > 0) {
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + Number(intervals.interval_days));
                const nextDateStr = nextDate.toISOString().split('T')[0];
                await conn.query("UPDATE patients SET next_suggested_prescription_date = ? WHERE id = ?", [nextDateStr, patientId]);
                console.log(`DEBUG: Set next suggested prescription date to ${nextDateStr}`);
            }
        }

        logAction(req, 'CREATE_PRESCRIPTION', `Patient: ${patientName}`);

        res.status(201).send("Prescription created");
    } catch (err) {
        console.error("DEBUG: createPrescription error", err);
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
        else if (role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docInfo.length > 0) {
                query += " WHERE a.doctor_id = ?";
                params.push(docInfo[0].id);
            }
        }

        if (req.query.patientId) {
            if (query.includes(' WHERE ')) {
                query += " AND a.patient_id = ?";
            } else {
                query += " WHERE a.patient_id = ?";
            }
            params.push(req.query.patientId);
        }

        query += " ORDER BY a.appointment_date DESC";

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updatePrescription = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { medications, instructions } = req.body;
        const { role, user_id } = req.user;

        if (!medications || !medications.trim()) {
            return res.status(400).send("Medications are required");
        }

        conn = await pool.getConnection();

        // Check prescription existence and owner
        const prescription = await conn.query(`
            SELECT pr.*, a.doctor_id 
            FROM prescriptions pr
            JOIN appointments a ON pr.appointment_id = a.id
            WHERE pr.id = ?`, [id]);

        if (prescription.length === 0) {
            return res.status(404).send("Prescription not found");
        }

        // Authorization: Admin, Secretary (if permitted) or the Doctor who wrote it
        let authorized = (role === 'admin');

        if (role === 'secretary') {
            const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_prescriptions'");
            const canEdit = settings.length > 0 && settings[0].setting_value === 'true';
            authorized = canEdit;
        }

        if (role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docInfo.length > 0 && docInfo[0].id === prescription[0].doctor_id) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).send("Unauthorized");
        }

        await conn.query(
            "UPDATE prescriptions SET medications = ?, instructions = ? WHERE id = ?",
            [medications, instructions, id]
        );

        logAction(req, 'UPDATE_PRESCRIPTION', `Prescription ID: ${id}`);
        res.send("Prescription updated");
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
            SELECT p.full_name, p.id as patient_id, p.user_id as patient_user_id
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?`, [appointment_id]);

        const patientName = details.length > 0 ? details[0].full_name : 'Unknown Patient';

        // Calculate Debt
        if (details.length > 0) {
            const patientId = details[0].patient_id;
            const patientUserId = details[0].patient_user_id;
            const doctorId = appt[0].doctor_id; // appt is available from check above

            const { price } = await calculatePrice(conn, doctorId, patientId, 'medical_license');

            if (price > 0) {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ['income_patient', price, `Medical License - ${days_duration} days`, patientUserId, doctorId, 'credit', 'pending']
                );
                console.log(`DEBUG: Generated debt of $${price} for license`);
            }

            // --- REMINDER LOGIC: Update license expiry date ---
            const startDate = new Date(start_date);
            const expiryDate = new Date(startDate.getTime() + (Number(days_duration) * 24 * 60 * 60 * 1000));
            const expiryDateStr = expiryDate.toISOString().split('T')[0];
            await conn.query("UPDATE patients SET license_expiry_date = ? WHERE id = ?", [expiryDateStr, patientId]);
            console.log(`DEBUG: Set license expiry date to ${expiryDateStr}`);
        }

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

        if (req.query.patientId) {
            if (query.includes(' WHERE ')) {
                query += " AND a.patient_id = ?";
            } else {
                query += " WHERE a.patient_id = ?";
            }
            params.push(req.query.patientId);
        }

        query += " ORDER BY a.appointment_date DESC";

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateLicense = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { start_date, days_duration, diagnosis } = req.body;
        const { role, user_id } = req.user;

        conn = await pool.getConnection();

        // Check license existence and owner
        const license = await conn.query(`
            SELECT ml.*, a.doctor_id 
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
            WHERE ml.id = ?`, [id]);

        if (license.length === 0) {
            return res.status(404).send("License not found");
        }

        // Authorization: Admin, Secretary (if permitted) or the Doctor who wrote it
        let authorized = (role === 'admin');

        if (role === 'secretary') {
            const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_licenses'");
            const canEdit = settings.length > 0 && settings[0].setting_value === 'true';
            authorized = canEdit;
        }

        if (role === 'doctor') {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (docInfo.length > 0 && docInfo[0].id === license[0].doctor_id) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).send("Unauthorized");
        }

        await conn.query(
            "UPDATE medical_licenses SET start_date = ?, days_duration = ?, diagnosis = ? WHERE id = ?",
            [start_date, days_duration, diagnosis, id]
        );

        logAction(req, 'UPDATE_LICENSE', `License ID: ${id}`);
        res.send("License updated");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deletePrescription = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;
        const { role } = req.user;

        if (role !== 'admin') {
            if (role === 'secretary') {
                const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_prescriptions'");
                if (settings.length === 0 || settings[0].setting_value !== 'true') {
                    return res.status(403).send("Unauthorized. Ask admin to enable unrestricted CRUD.");
                }
            } else {
                return res.status(403).send("Unauthorized");
            }
        }
        const result = await conn.query("DELETE FROM prescriptions WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).send("Prescription not found");
        }

        logAction(req, 'DELETE_PRESCRIPTION', `Deleted Prescription ID: ${id}`);
        res.json({ message: "Prescription deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteLicense = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;
        const { role } = req.user;

        if (role !== 'admin') {
            if (role === 'secretary') {
                const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_licenses'");
                if (settings.length === 0 || settings[0].setting_value !== 'true') {
                    return res.status(403).send("Unauthorized. Ask admin to enable unrestricted CRUD.");
                }
            } else {
                return res.status(403).send("Unauthorized");
            }
        }
        const result = await conn.query("DELETE FROM medical_licenses WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).send("License not found");
        }

        logAction(req, 'DELETE_LICENSE', `Deleted License ID: ${id}`);
        res.json({ message: "License deleted" });
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
        const { type, patient_id, doctor_id, request_note, bonified, status, payment_method } = req.body; // type: 'prescription', 'license', 'certificate'

        if (!['prescription', 'license', 'certificate'].includes(type)) return res.status(400).send("Invalid type");

        conn = await pool.getConnection();

        // Check if patient exists
        const pat = await conn.query("SELECT * FROM patients WHERE id = ?", [patient_id]);
        if (pat.length === 0) return res.status(404).send("Patient not found");

        const initialStatus = status || 'pending';

        let completedAtQueryPart = '?';
        let queryParams = [type, patient_id, doctor_id, request_note, initialStatus, payment_method || 'cash', null];

        if (initialStatus === 'completed') {
            completedAtQueryPart = 'NOW()';
            queryParams = [type, patient_id, doctor_id, request_note, initialStatus, payment_method || 'cash'];
        }

        const result = await conn.query(
            `INSERT INTO medical_requests (type, patient_id, doctor_id, request_note, status, payment_method, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), ${completedAtQueryPart})`,
            queryParams
        );

        // --- Debt Generation for Request ---
        // If not bonified, generate debt immediately for the request
        if (!bonified) {
            let serviceType = 'consultation';
            if (type === 'prescription') serviceType = 'prescription';
            else if (type === 'license') serviceType = 'medical_license';
            else if (type === 'certificate') serviceType = 'certificate';

            const priceInfo = await calculatePrice(conn, doctor_id, patient_id, serviceType);
            if (priceInfo.price > 0) {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                    ['income_patient', priceInfo.price, `Request: ${type} for ${pat[0].full_name}`, pat[0].user_id, doctor_id, payment_method || 'cash', 'pending', result.insertId]
                );
                // Update request with debt status
                await conn.query("UPDATE medical_requests SET payment_status = 'debt', debt_amount = ? WHERE id = ?", [priceInfo.price, result.insertId]);
            }
        } else {
            await conn.query("UPDATE medical_requests SET payment_status = 'bonified' WHERE id = ?", [result.insertId]);
        }
        // -----------------------------------


        logAction(req, 'CREATE_MEDICAL_REQUEST', `Type: ${type}, Patient: ${pat[0].full_name} (ID: ${patient_id}). Details: ${request_note}`);

        res.status(201).json({ id: Number(result.insertId), message: "Request created" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating request: " + err.message);
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
            s.username as secretary_name
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

        // [NEW] Filter by specific patient
        if (req.query.patientId) {
            if (query.includes(' WHERE ')) {
                query += " AND r.patient_id = ?";
            } else {
                query += " WHERE r.patient_id = ?";
            }
            params.push(req.query.patientId);
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
        const { status, doctor_note, secretary_note } = req.body;
        const { role } = req.user;

        // Validation: Message mandatory for 'rejected' and 'consult'
        if ((status === 'rejected' || status === 'consult') && !doctor_note && role === 'doctor') {
            return res.status(400).json({ message: "Note is required for this status" });
        }

        conn = await pool.getConnection();

        // Check permission if secretary
        let isUnrestrictedSecretary = false;
        if (role === 'secretary') {
            const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_requests'");
            isUnrestrictedSecretary = settings.length > 0 && settings[0].setting_value === 'true';
        }

        // [RULE] If completed/rejected before today, only admin or unrestricted secretary can touch it
        const reqInfo = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        if (reqInfo.length === 0) return res.status(404).json({ message: "Request not found" });

        if (role !== 'admin' && !isUnrestrictedSecretary && (reqInfo[0].status === 'completed' || reqInfo[0].status === 'rejected')) {
            const completedDate = new Date(reqInfo[0].completed_at || reqInfo[0].updated_at).toLocaleDateString();
            const todayDate = new Date().toLocaleDateString();
            if (completedDate !== todayDate) {
                return res.status(403).json({ message: "Completed/Rejected requests from previous days can only be managed by administrators." });
            }
        }

        let setClause = "status = ?";
        let params = [status];

        // If doctor adds a note
        if (doctor_note !== undefined) {
            setClause += ", doctor_note = ?";
            params.push(doctor_note);
        }

        // If secretary replies
        if (secretary_note !== undefined) {
            setClause += ", secretary_note = ?";
            params.push(secretary_note);
        }

        if (status === 'completed' || status === 'rejected') {
            setClause += ", completed_at = NOW()";
        }

        const query = `UPDATE medical_requests SET ${setClause} WHERE id = ?`;
        params.push(id);

        await conn.query(query, params);

        logAction(req, 'UPDATE_MEDICAL_REQUEST', `Request ${id} updated to ${status}`);
        res.json({ message: "Request updated" });
    } catch (err) {
        console.error("Update Request Status Error:", err);
        res.status(500).json({ message: "Server Error: " + err.message });
    } finally {
        if (conn) conn.release();
    }
};

exports.updateRequest = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { request_note, doctor_note, debt_amount, payment_method } = req.body;
        const { role } = req.user;

        conn = await pool.getConnection();

        // Check permission if secretary
        let isUnrestrictedSecretary = false;
        if (role === 'secretary') {
            const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_requests'");
            isUnrestrictedSecretary = settings.length > 0 && settings[0].setting_value === 'true';
        }

        // Check if request exists
        const reqInfo = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        if (reqInfo.length === 0) return res.status(404).send("Request not found");

        // Authorization: Admin, Secretary (if permitted) or the Doctor of the request
        if (role !== 'admin' && !isUnrestrictedSecretary) {
            const docInfo = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);
            if (docInfo.length === 0 || docInfo[0].id !== reqInfo[0].doctor_id) {
                return res.status(403).send("Unauthorized");
            }
        }

        // [RULE] If completed/rejected before today, only admin or unrestricted secretary can touch it (bypass for unrestr sec)
        if (role !== 'admin' && !isUnrestrictedSecretary && (reqInfo[0].status === 'completed' || reqInfo[0].status === 'rejected')) {
            const completedDate = new Date(reqInfo[0].completed_at || reqInfo[0].updated_at).toLocaleDateString();
            const todayDate = new Date().toLocaleDateString();
            if (completedDate !== todayDate) {
                return res.status(403).json({ message: "Completed/Rejected requests from previous days can only be managed by administrators." });
            }
        }

        let setClause = "updated_at = NOW()";
        let params = [];

        if (request_note !== undefined) {
            setClause += ", request_note = ?";
            params.push(request_note);
        }
        if (doctor_note !== undefined) {
            setClause += ", doctor_note = ?";
            params.push(doctor_note);
        }
        if (debt_amount !== undefined) {
            setClause += ", debt_amount = ?";
            params.push(debt_amount);
        }
        if (payment_method !== undefined) {
            setClause += ", payment_method = ?";
            params.push(payment_method);
        }

        // [NEW] Handle bonified status Update
        const isBonified = req.body.bonified === true || req.body.bonified === 'true';
        const isUnbonified = req.body.bonified === false || req.body.bonified === 'false';

        if (isBonified) {
            setClause += ", payment_status = 'bonified', debt_amount = 0";
        } else if (isUnbonified && reqInfo[0].payment_status === 'bonified' && Number(debt_amount) > 0) {
            setClause += ", payment_status = 'debt'";
        }

        const query = `UPDATE medical_requests SET ${setClause} WHERE id = ?`;
        params.push(id);

        await conn.query(query, params);

        // [SYNC] Update associated pending transaction amount if debt_amount changed
        if (debt_amount !== undefined && req.body.bonified !== true) {
            await conn.query("UPDATE transactions SET amount = ? WHERE request_id = ? AND status = 'pending'", [debt_amount, id]);
        }
        if (payment_method !== undefined) {
            await conn.query("UPDATE transactions SET method = ? WHERE request_id = ? AND status = 'pending'", [payment_method, id]);
        }

        // [NEW] If bonified, delete pending debt transactions
        if (isBonified) {
            await conn.query("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'", [id]);
        }

        // [NEW] If un-bonified and returning to debt, create transaction
        if (isUnbonified && reqInfo[0].payment_status === 'bonified' && Number(debt_amount) > 0) {
            const pat = await conn.query("SELECT user_id FROM patients WHERE id = ?", [reqInfo[0].patient_id]);
            if (pat.length > 0) {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                    ['income_patient', debt_amount, `Request: ${reqInfo[0].type}`, pat[0].user_id, reqInfo[0].doctor_id, payment_method || 'cash', 'pending', id]
                );
            }
        }

        logAction(req, 'MANUAL_EDIT_REQUEST', `Request ${id} edited manually`);
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

exports.deleteRequest = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;
        const { role } = req.user;

        if (role !== 'admin') {
            if (role === 'secretary') {
                const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_requests'");
                if (settings.length === 0 || settings[0].setting_value !== 'true') {
                    return res.status(403).send("Unauthorized. Ask admin to enable unrestricted CRUD.");
                }
            } else {
                return res.status(403).send("Only admins and secretaries can delete requests");
            }
        }

        // [RULE] Same-day rule for deletion (Only if NOT unrestricted, but if enabled above, sec is like admin)
        // Actually, if enabled, secretaries bypass the same-day rule? 
        // Let's assume enabling CRUD gives full power, mimicking admin logic for deletion.

        const reqInfo = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        if (reqInfo.length === 0) return res.status(404).send("Request not found");

        if (role !== 'admin' && role !== 'secretary') {
            // Standard user logic (doctors might delete if pending? logic below was mostly admin/sec)
            if (reqInfo[0].status === 'completed' || reqInfo[0].status === 'rejected') {
                return res.status(403).send("Cannot delete completed requests");
            }
        }

        // If secretary didn't have the setting, they would have been blocked at start.
        // If they have it, they proceed.

        // Backup
        console.log(`DEBUG: Deleting request ${id}`);
        const requestData = reqInfo[0];
        if (!requestData.patient_id) {
            throw new Error("Request has no patient_id associated");
        }

        const patRows = await conn.query("SELECT full_name FROM patients WHERE id = ?", [requestData.patient_id]);
        const patientName = patRows.length > 0 ? patRows[0].full_name : "Unknown";
        console.log(`DEBUG: Found patient ${patientName} for request ${id}`);

        try {
            await saveToRecycleBin(req, 'medical_request', id, `${requestData.type} - ${patientName}`, requestData);
            console.log(`DEBUG: Saved request ${id} to recycle bin`);
        } catch (rbErr) {
            console.error("DEBUG: RecycleBin error (non-fatal)", rbErr);
        }

        // 1. Delete associated PENDING transactions (cleanup debt)
        const transResult = await conn.query("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'", [id]);
        console.log(`DEBUG: Deleted ${transResult.affectedRows} pending transactions for request ${id}`);

        // 2. Delete the request
        const result = await conn.query("DELETE FROM medical_requests WHERE id = ?", [id]);
        console.log(`DEBUG: Delete result for request ${id}:`, result);

        if (result.affectedRows === 0) {
            return res.status(404).send("Request not found during final deletion");
        }

        logAction(req, 'DELETE_MEDICAL_REQUEST', `Deleted Request ID: ${id}`);
        res.json({ message: "Request deleted successfully" });

    } catch (err) {
        console.error("CRITICAL DELETE ERROR:", err);
        res.status(500).send("Error deleting request: " + err.message + (err.code ? ` (${err.code})` : ""));
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteFile = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;
        const { role } = req.user;

        if (role !== 'admin') {
            if (role === 'secretary') {
                const settings = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_crud_files'");
                if (settings.length === 0 || settings[0].setting_value !== 'true') {
                    return res.status(403).send("Unauthorized. Ask admin to enable unrestricted CRUD.");
                }
            } else {
                return res.status(403).send("Unauthorized. Only admins and secretaries can delete files.");
            }
        }
        const file = await conn.query("SELECT file_url FROM patient_files WHERE id = ?", [id]);

        if (file.length === 0) {
            return res.status(404).json({ message: "File not found" });
        }

        const filePath = path.join(__dirname, '../../', file[0].file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await conn.query("DELETE FROM patient_files WHERE id = ?", [id]);
        logAction(req, 'DELETE_FILE', `Deleted File ID: ${id}`);
        res.json({ message: "File deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// --- Exports ---
exports.exportPrescriptionsJSON = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        const { preview } = req.query; // Check for preview flag

        conn = await pool.getConnection();

        // We want to export both direct prescriptions and completed prescription requests
        let query = `
            (SELECT 
                'direct' as source_type,
                pr.id,
                pr.medications,
                pr.instructions,
                a.appointment_date as date,
                d.full_name as doctor_name,
                p.full_name as patient_name,
                p.dni as patient_dni,
                'paid' as payment_status, 
                 0 as amount, 
                 'N/A' as payment_method
            FROM prescriptions pr
            JOIN appointments a ON pr.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN patients p ON a.patient_id = p.id
            ${role === 'doctor' ? 'WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)' : ''}
            ${role === 'patient' ? 'WHERE a.patient_id = (SELECT id FROM patients WHERE user_id = ?)' : ''}
            )
            UNION ALL
            (SELECT 
                'request' as source_type,
                r.id,
                r.request_note as medications,
                r.doctor_note as instructions,
                r.completed_at as date,
                d.full_name as doctor_name,
                p.full_name as patient_name,
                p.dni as patient_dni,
                r.payment_status,
                COALESCE(NULLIF(r.debt_amount, 0), (SELECT amount FROM transactions WHERE request_id = r.id LIMIT 1), 0) as amount,
                r.payment_method
            FROM medical_requests r
            JOIN doctors d ON r.doctor_id = d.id
            JOIN patients p ON r.patient_id = p.id
            WHERE r.type = 'prescription' AND r.status = 'completed'
            ${role === 'doctor' ? 'AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)' : ''}
            ${role === 'patient' ? 'AND r.patient_id = (SELECT id FROM patients WHERE user_id = ?)' : ''}
            )
            ORDER BY date DESC
        `;

        let params = [];
        if (role === 'doctor' || role === 'patient') {
            params.push(user_id, user_id);
        }

        const rows = await conn.query(query, params);

        if (preview === 'true') {
            return res.json(rows);
        }

        res.setHeader('Content-disposition', 'attachment; filename=prescriptions_backup.json');
        res.setHeader('Content-type', 'application/json');
        res.write(JSON.stringify(rows, null, 2));
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
