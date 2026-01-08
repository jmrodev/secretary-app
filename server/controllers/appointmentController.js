const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const googleController = require('./googleController');
const { calculatePrice } = require('../utils/priceCalculator');

exports.createAppointment = async (req, res) => {
    let conn;
    try {
        const { doctor_id, appointment_date, reason, bonified } = req.body; // patient_id from token if patient, or body if secretary
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
        } else {
            conn = await pool.getConnection();
        }

        // --- Holiday Check ---
        // Extract YYYY-MM-DD from appointment_date (which is ISO-like YYYY-MM-DDTHH:mm)
        const datePart = appointment_date.split('T')[0];
        const holidays = await conn.query("SELECT * FROM active_holidays WHERE date = ?", [datePart]);
        if (holidays.length > 0) {
            return res.status(400).json({ error: `Clinic is closed on this date: ${holidays[0].description}` });
        }

        // --- Past Date Check ---
        const now = new Date();
        const apptDate = new Date(appointment_date);
        if (apptDate < now) {
            return res.status(400).json({ error: "Cannot book appointments in the past." });
        }
        // ---------------------

        // --- Google Calendar Conflict Check ---
        // Calculate End Time (Assuming 1 hour duration by default for now)
        const startTime = new Date(appointment_date);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const hasConflict = await googleController.checkConflict(doctor_id, startTime.toISOString(), endTime.toISOString());

        if (hasConflict) {
            return res.status(409).json({ error: "Doctor is busy at this time (Google Calendar Conflict)." });
        }
        // --------------------------------------

        // if (!conn) conn = await pool.getConnection(); // Already acquired

        // Simple insert
        const result = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason) VALUES (?, ?, ?, ?)",
            [patient_id, doctor_id, apptDate, reason]
        );
        const appointmentId = result.insertId;

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
            await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [googleEvent.id, appointmentId]);
        }
        // ---------------------------------

        logAction(req, 'CREATE_APPOINTMENT', `Patient: ${pNameStr}, Doctor: ${dNameStr}`);

        // --- Debt Generation ---
        if (!bonified && (req.user.role === 'secretary' || req.user.role === 'doctor')) {
            // Only generate debt if created by staff, or if we want patients to generate debt on booking? 
            // Usually booking doesn't charge until completion, but user said "Turno receta licencia" implies "Bonificado para turno". 
            // If it's bonified, free. If not, charge.
            // Let's assume on creation for now as per "Bonificado para turno...".

            const priceInfo = await calculatePrice(conn, doctor_id, patient_id, 'consultation');
            if (priceInfo.price > 0) {
                let relatedUserId = null;
                if (req.user.role === 'patient') {
                    relatedUserId = req.user.user_id;
                } else {
                    const pUser = await conn.query("SELECT user_id FROM patients WHERE id = ?", [patient_id]);
                    if (pUser.length > 0) relatedUserId = pUser[0].user_id;
                }

                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                    ['income_patient', priceInfo.price, `Consultation (Booking): ${pNameStr}`, relatedUserId, doctor_id, 'credit', 'pending']
                );
                // Also link transaction to appointment? The schema doesn't seem to have direct link in transactions table easily inferred, 
                // but we can update appointment payment_status.
                await conn.query("UPDATE appointments SET payment_status = 'debt' WHERE id = ?", [result.insertId]);
            }
        }
        // -----------------------

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

exports.deleteAppointment = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();

        // Get details for log
        const rows = await conn.query("SELECT a.*, p.full_name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = ?", [id]);
        if (rows.length === 0) return res.status(404).send("Appointment not found");

        const appt = rows[0];

        // Delete
        await conn.query("DELETE FROM appointments WHERE id = ?", [id]);

        logAction(req, 'DELETE_APPOINTMENT', `Deleted appointment ID ${id} (Secretary Error) for ${appt.full_name}`);

        res.json({ message: "Appointment deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateAppointment = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { appointment_date, reason } = req.body;

        conn = await pool.getConnection();

        // Check existence
        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        const oldDate = exists[0].appointment_date;

        // Update status to 'rescheduled' when moved
        const apptDate = new Date(appointment_date);
        await conn.query(
            "UPDATE appointments SET appointment_date = ?, reason = ?, status = 'rescheduled' WHERE id = ?",
            [apptDate, reason || exists[0].reason, id]
        );

        // Log
        logAction(req, 'RESCHEDULE_APPOINTMENT', `Rescheduled Appt ID ${id} from ${oldDate} to ${appointment_date}`);

        res.json({ message: "Appointment updated" });
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
        const { status, reason } = req.body; // reason is optional, for cancellation

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'suspended', 'absent'];
        if (!validStatuses.includes(status)) return res.status(400).send("Invalid status");

        conn = await pool.getConnection();

        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        await conn.query("UPDATE appointments SET status = ?, cancellation_reason = ? WHERE id = ?", [status, reason || null, id]);

        const pId = exists[0].patient_id;
        const pat = await conn.query("SELECT full_name FROM patients WHERE id = ?", [pId]);
        const pName = pat.length > 0 ? pat[0].full_name : pId;

        let logMsg = `Appointment for ${pName} changed to ${status}`;
        if (status === 'cancelled' && reason) {
            logMsg += `. Reason: ${reason}`;
        }
        logAction(req, 'UPDATE_APPOINTMENT_STATUS', logMsg);

        res.json({ message: "Status updated" });

        // --- Google Calendar Sync ---
        if (exists[0].google_event_id) {
            await googleController.updateEventHelper(exists[0].doctor_id, exists[0].google_event_id, {
                status: status,
                paymentStatus: exists[0].payment_status
            }, req.user.user_id);
        }
        // ----------------------------
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

        const isPaid = status === 'paid' ? 1 : 0;
        conn = await pool.getConnection();
        await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [status, isPaid, id]);

        res.json({ message: "Payment status updated" });

        // --- Google Calendar Sync ---
        const [appt] = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (appt && appt.google_event_id) {
            await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, {
                status: appt.status,
                paymentStatus: status
            }, req.user.user_id);
        }
        // ----------------------------
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
