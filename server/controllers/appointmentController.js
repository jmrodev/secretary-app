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
        if (req.user.role === 'patient' && apptDate < now) {
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
        const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [patient_id]);
        const docName = await conn.query("SELECT full_name FROM doctors WHERE id = ?", [doctor_id]);

        const pNameStr = patData.length > 0 ? patData[0].full_name : patient_id;
        const dNameStr = docName.length > 0 ? docName[0].full_name : doctor_id;
        const pDetails = patData.length > 0 ? patData[0] : {};

        // --- Debt Generation ---
        let paymentStatus = 'pending';
        try {
            if (!bonified && (req.user.role === 'secretary' || req.user.role === 'doctor')) {
                const priceInfo = await calculatePrice(conn, doctor_id, patient_id, 'consultation');
                if (priceInfo.price > 0) {
                    let relatedUserId = null;
                    if (req.user.role === 'patient') {
                        relatedUserId = req.user.user_id;
                    } else {
                        const pUser = await conn.query("SELECT user_id FROM patients WHERE id = ?", [patient_id]);
                        if (pUser.length > 0) {
                            // Validate user existence to prevent FK Error
                            const userExists = await conn.query("SELECT id FROM users WHERE id = ?", [pUser[0].user_id]);
                            if (userExists.length > 0) {
                                relatedUserId = pUser[0].user_id;
                            } else {
                                console.warn(`Skipping related_user_id for debt: User ${pUser[0].user_id} not found in users table.`);
                            }
                        }
                    }

                    await conn.query(
                        "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                        ['income_patient', priceInfo.price, `Consultation (Booking): ${pNameStr}`, relatedUserId, doctor_id, 'credit', 'pending']
                    );

                    await conn.query("UPDATE appointments SET payment_status = 'debt' WHERE id = ?", [appointmentId]);
                    paymentStatus = 'debt';
                }
            }
        } catch (debtError) {
            console.error("Debt Generation Failed (Non-fatal):", debtError);
            // We do NOT re-throw, so the appointment remains valid.
        }
        // -----------------------

        // --- Google Calendar Auto-Sync ---
        const eventData = {
            summary: `Consultorio: ${pNameStr} [${paymentStatus === 'debt' ? 'DEUDA' : 'PENDIENTE'}]`,
            description: `Motivo: ${reason}\nPaciente: ${pNameStr} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: pendiente\nPago: ${paymentStatus === 'debt' ? 'deuda' : 'pendiente'}\nCreado por Aplicación de Secretaría`,
            start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
        };

        try {
            const googleEvent = await googleController.createEventHelper(doctor_id, eventData, req.user.user_id);
            if (googleEvent) {
                console.log(`Synced to Google Calendar: ${googleEvent.id}`);
                await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [googleEvent.id, appointmentId]);
            } else {
                throw new Error("Sync failed (returned null)");
            }
        } catch (syncErr) {
            console.warn("Google Sync Failed, queueing retry:", syncErr.message);
            await conn.query(
                "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'create', ?, 'pending')",
                [appointmentId, doctor_id, JSON.stringify(eventData)]
            );
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
        let query = "SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating, d.full_name as doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id";
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

        console.log(`[getAppointments] Request from UserID: ${user_id}, Role: ${role}`);
        // [NEW] Filter by specific patient (for history view)
        if (req.query.patientId) {
            if (query.includes(' WHERE ')) {
                query += " AND a.patient_id = ?";
            } else {
                query += " WHERE a.patient_id = ?";
            }
            params.push(req.query.patientId);
        }

        query += " ORDER BY a.appointment_date DESC"; // Ensure history is ordered

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

        // [NEW] Prevent deletion if status is 'completed' (Attended)
        if (appt.status === 'completed') {
            return res.status(400).send("Cannot delete an appointment that has been attended (completed).");
        }

        // --- Google Calendar Sync (Delete) ---
        if (appt.google_event_id) {
            await googleController.deleteEventHelper(appt.doctor_id, appt.google_event_id, req.user.user_id);
        }
        // -------------------------------------

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

        const apptDate = new Date(appointment_date);
        const oldDateObj = new Date(oldDate);

        // Only change status to 'rescheduled' if the date/time actually changed
        const isReschedule = apptDate.getTime() !== oldDateObj.getTime();
        const newStatus = isReschedule ? 'rescheduled' : exists[0].status;

        await conn.query(
            "UPDATE appointments SET appointment_date = ?, reason = ?, status = ? WHERE id = ?",
            [apptDate, reason || exists[0].reason, newStatus, id]
        );

        // Log
        logAction(req, 'RESCHEDULE_APPOINTMENT', `Rescheduled Appt ID ${id} from ${oldDate} to ${appointment_date}`);

        res.json({ message: "Appointment updated" });

        // --- Google Calendar Sync ---
        if (exists[0].google_event_id) {
            const startTime = new Date(appointment_date);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

            const pId = exists[0].patient_id;
            const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [pId]);
            const pName = pat.length > 0 ? pat[0].full_name : pId;
            const pDetails = pat.length > 0 ? pat[0] : {};
            const newDescription = `Motivo: ${reason || exists[0].reason}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: reprogramado\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: `Consultorio: ${pName} [${exists[0].payment_status.toUpperCase() === 'PAID' ? 'PAGADO' : (exists[0].payment_status.toUpperCase() === 'DEBT' ? 'DEUDA' : (exists[0].payment_status.toUpperCase() === 'PENDING' ? 'PENDIENTE' : 'PARCIAL'))}]`,
                description: newDescription,
                start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                status: 'rescheduled',
                paymentStatus: exists[0].payment_status
            };

            try {
                const result = await googleController.updateEventHelper(exists[0].doctor_id, exists[0].google_event_id, updatePayload, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Update), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                    [id, exists[0].doctor_id, JSON.stringify({ eventId: exists[0].google_event_id, updates: updatePayload })]
                );
            }
        }
        // ----------------------------
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
        const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [pId]);
        const pName = pat.length > 0 ? pat[0].full_name : pId;
        const pDetails = pat.length > 0 ? pat[0] : {};

        let logMsg = `Appointment for ${pName} changed to ${status}`;
        if (status === 'cancelled' && reason) {
            logMsg += `. Reason: ${reason}`;
        }
        logAction(req, 'UPDATE_APPOINTMENT_STATUS', logMsg);

        res.json({ message: "Status updated" });

        // --- Google Calendar Sync ---
        if (exists[0].google_event_id) {
            const newDescription = `Motivo: ${exists[0].reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${status}\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: `Consultorio: ${pName} [${exists[0].payment_status.toUpperCase()}]`,
                status: status,
                paymentStatus: exists[0].payment_status,
                description: newDescription
            };

            try {
                const result = await googleController.updateEventHelper(exists[0].doctor_id, exists[0].google_event_id, updatePayload, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Status Update), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                    [id, exists[0].doctor_id, JSON.stringify({ eventId: exists[0].google_event_id, updates: updatePayload })]
                );
            }
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
            const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [appt.patient_id]);
            const pName = patData.length > 0 ? patData[0].full_name : appt.patient_id;
            const pDetails = patData.length > 0 ? patData[0] : {};

            const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${appt.status}\nPago: ${status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: `Consultorio: ${pName} [${status.toUpperCase() === 'PAID' ? 'PAGADO' : (status.toUpperCase() === 'DEBT' ? 'DEUDA' : 'PARCIAL')}]`,
                status: appt.status,
                paymentStatus: status,
                description: newDescription
            };

            try {
                const result = await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Payment Update), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                    [id, appt.doctor_id, JSON.stringify({ eventId: appt.google_event_id, updates: updatePayload })]
                );
            }
        }
        // ----------------------------
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
