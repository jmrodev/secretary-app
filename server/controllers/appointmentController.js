const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const googleController = require('./googleController');

exports.createAppointment = async (req, res) => {
    let conn;
    try {
        const { doctor_id, appointment_date, reason } = req.body; // patient_id from token if patient, or body if secretary
        let patient_id = req.body.patient_id;

        if (req.user.role === 'patient') {
            // Get patient profile id
            conn = await pool.getConnection();
            const rows = await conn.query("SELECT id FROM patients WHERE user_id = ?", [req.user.user_id]);
            if (rows.length > 0) {
                patient_id = rows[0].id;
            } else {
                return res.status(404).send("Patient profile not found");
            }
        }

        // --- Google Calendar Conflict Check ---
        // Calculate End Time (Assuming 1 hour duration by default for now)
        const startTime = new Date(appointment_date);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const hasConflict = await googleController.checkConflict(doctor_id, startTime.toISOString(), endTime.toISOString());

        if (hasConflict) {
            return res.status(409).json({ error: "Doctor is busy at this time (Google Calendar Conflict)." });
        }
        // --------------------------------------

        if (!conn) conn = await pool.getConnection();

        // Simple insert
        const result = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason) VALUES (?, ?, ?, ?)",
            [patient_id, doctor_id, appointment_date, reason]
        );

        // Fetch names for logging and Sync
        const patName = await conn.query("SELECT full_name FROM patients WHERE id = ?", [patient_id]);
        const docName = await conn.query("SELECT full_name FROM doctors WHERE id = ?", [doctor_id]);

        const pNameStr = patName.length > 0 ? patName[0].full_name : patient_id;
        const dNameStr = docName.length > 0 ? docName[0].full_name : doctor_id;

        // --- Google Calendar Auto-Sync ---
        // Fire and forget (or await if critical). We await to log success/fail but don't fail the request if it fails?
        // Let's await to be safe.
        const eventData = {
            summary: `Consultorio: ${pNameStr}`,
            description: `Reason: ${reason}\nCreated by Secretary App`,
            start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
        };

        const googleEvent = await googleController.createEventHelper(doctor_id, eventData, req.user.user_id);
        if (googleEvent) {
            console.log(`Synced to Google Calendar: ${googleEvent.id}`);
        }
        // ---------------------------------

        logAction(req, 'CREATE_APPOINTMENT', `Patient: ${pNameStr}, Doctor: ${dNameStr}`);

        res.status(201).json({ id: Number(result.insertId), message: "Appointment created" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getAppointments = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { role, user_id } = req.user;
        let query = "SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating, d.full_name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id";
        let params = [];

        if (role === 'patient') {
            const pRows = await conn.query("SELECT id FROM patients WHERE user_id = ?", [user_id]);
            if (pRows.length > 0) {
                query += " WHERE a.patient_id = ?";
                params.push(pRows[0].id);
            }
        } else if (role === 'doctor') {
            const dRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (dRows.length > 0) {
                query += " WHERE a.doctor_id = ?";
                params.push(dRows[0].id);
            }
        }
        // Secretary/Admin sees all

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateStatus = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).send("Invalid status");

        conn = await pool.getConnection();

        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        await conn.query("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);

        const pId = exists[0].patient_id;
        const pat = await conn.query("SELECT full_name FROM patients WHERE id = ?", [pId]);
        const pName = pat.length > 0 ? pat[0].full_name : pId;

        logAction(req, 'UPDATE_APPOINTMENT_STATUS', `Appointment for ${pName} changed to ${status}`);

        res.json({ message: "Status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }

};

exports.updatePaymentStatus = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { status } = req.body;

        conn = await pool.getConnection(); // missing await in previous pattern? Fixed here.
        await conn.query("UPDATE appointments SET payment_status = ? WHERE id = ?", [status, id]);

        res.json({ message: "Payment status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
