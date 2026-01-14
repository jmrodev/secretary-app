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
        // Calculate End Time
        const [docData] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [doctor_id]);
        const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

        const startTime = new Date(appointment_date);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const hasConflict = await googleController.checkConflict(doctor_id, startTime.toISOString(), endTime.toISOString());

        if (hasConflict) {
            return res.status(409).json({ error: "Doctor is busy at this time (Google Calendar Conflict)." });
        }
        // --------------------------------------

        // --- Out of Hours Check ---
        let isOutOfHours = 0;
        // Fetch schedule for this day
        const dayOfWeek = apptDate.getDay(); // 0-6
        const scheduleRows = await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_break = 0",
            [doctor_id, dayOfWeek]
        );

        if (scheduleRows.length > 0) {
            const apptTimeStr = apptDate.toTimeString().split(' ')[0]; // HH:MM:SS
            // Check if it fits in ANY block
            const fits = scheduleRows.some(block => {
                return apptTimeStr >= block.start_time && apptTimeStr < block.end_time;
            });

            if (!fits) isOutOfHours = 1;
        } else {
            // Default 8-20 if no schedule defined? Or assume OOH?
            // Let's keep legacy behavior: if NO schedule defined, assume 8-20 is "In Hours" for now, or just 0.
            // But user wants to define it. If empty, maybe everything is OOH? Or everything allowed?
            // Let's assume default 8-20 for backward compatibility if table exists but no rows for doc.
            // Actually, safely assume In-Hours if no config, to avoid mass flagging.
            const hour = apptDate.getHours();
            if (hour < 8 || hour >= 20) isOutOfHours = 1;
        }
        // --------------------------

        // if (!conn) conn = await pool.getConnection(); // Already acquired

        const result = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, is_out_of_hours) VALUES (?, ?, ?, ?, ?)",
            [patient_id, doctor_id, apptDate, reason, isOutOfHours]
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
            summary: pNameStr,
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
        let query = `
            SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating, 
            (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.related_user_id = p.user_id AND t.status = 'pending') as total_debt,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id) as total_appointments,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id AND a2.status IN ('cancelled', 'absent')) as missed_appointments,
            d.full_name as doctor_name 
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id 
            JOIN doctors d ON a.doctor_id = d.id
        `;
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

        // Get details for log - Use LEFT JOIN to allow deleting appointments without linked patients (e.g. synced Google events)
        const rows = await conn.query(`
            SELECT a.*, p.full_name 
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).send("Appointment not found");


        const appt = rows[0];

        // 1. Block Deletion of Past Appointments
        const now = new Date();
        const apptDate = new Date(appt.appointment_date);
        if (apptDate < now) {
            return res.status(400).send("Cannot delete past appointments.");
        }

        // 2. Block Deletion of Completed/Arrived Appointments
        // "si vino o completo" -> arrived, completed
        if (['completed', 'attended', 'arrived'].includes(appt.status)) {
            return res.status(400).send("Cannot delete an appointment that has been attended/completed.");
        }

        // 3. Check for "Other Completed Actions" (Medical Records)
        const prescriptions = await conn.query("SELECT id FROM prescriptions WHERE appointment_id = ?", [id]);
        const licenses = await conn.query("SELECT id FROM medical_licenses WHERE appointment_id = ?", [id]);

        if (prescriptions.length > 0 || licenses.length > 0) {
            return res.status(400).send("Cannot delete appointment: It has associated medical records (Prescriptions/Licenses).");
        }

        // 4. Handle Payment -> Convert to Credit ("Saldo a favor")
        if (appt.payment_status === 'paid') {
            const transactions = await conn.query(
                "SELECT id, description FROM transactions WHERE appointment_id = ? AND type = 'income_patient' AND status = 'paid'",
                [id]
            );

            if (transactions.length > 0) {
                for (const tx of transactions) {
                    const newDesc = `Saldo a favor (Turno Eliminado ${new Date(appt.appointment_date).toLocaleDateString()}): ${tx.description}`;
                    await conn.query("UPDATE transactions SET description = ? WHERE id = ?", [newDesc, tx.id]);
                }
                console.log(`Converted transaction(s) to credit for appt ${id}`);
            }
        }


        // --- Google Calendar Sync (Delete) ---
        if (appt.google_event_id) {
            try {
                await googleController.deleteEventHelper(appt.doctor_id, appt.google_event_id, req.user.user_id);
            } catch (syncErr) {
                console.warn(`[DeleteSync] Failed to delete event ${appt.google_event_id} from Google: ${syncErr.message}. Proceeding with DB deletion.`);
            }
        }
        // -------------------------------------

        // Delete
        await conn.query("DELETE FROM appointments WHERE id = ?", [id]);

        const loggedName = appt.full_name || appt.reason || `Appt ID ${id}`;
        logAction(req, 'DELETE_APPOINTMENT', `Deleted appointment ID ${id} (Secretary Error) for ${loggedName}`);

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
            // [NEW] Get Duration
            const [docData] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [exists[0].doctor_id]);
            const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

            const startTime = new Date(appointment_date);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            const pId = exists[0].patient_id;
            const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [pId]);
            const pName = pat.length > 0 ? pat[0].full_name : pId;
            const pDetails = pat.length > 0 ? pat[0] : {};
            const newDescription = `Motivo: ${reason || exists[0].reason}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: reprogramado\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: pName,
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

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'suspended', 'absent', 'rescheduled', 'arrived'];
        if (!validStatuses.includes(status)) return res.status(400).send("Invalid status");

        conn = await pool.getConnection();

        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        await conn.query("UPDATE appointments SET status = ?, cancellation_reason = ? WHERE id = ?", [status, reason || null, id]);

        // --- REMINDER LOGIC: Update next suggested visit date if completed ---
        if (status === 'completed') {
            const [intervals] = await conn.query(`
                SELECT 
                    COALESCE(p.visit_interval_days, d.default_visit_interval_days) as interval_days,
                    p.id as patient_id, d.id as doctor_id
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.id = ?
            `, [id]);

            if (intervals && intervals.interval_days > 0) {
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + Number(intervals.interval_days));
                const nextDateStr = nextDate.toISOString().split('T')[0];
                await conn.query("UPDATE patients SET next_suggested_visit_date = ? WHERE id = ?", [nextDateStr, intervals.patient_id]);
                console.log(`DEBUG: Set next suggested visit date to ${nextDateStr} for appointment ${id}`);
            }
        }

        if (status === 'cancelled') {
            const pId = exists[0].patient_id;
            if (pId) {
                // Decrement behavior rating (min 0)
                await conn.query("UPDATE patients SET behavior_rating = GREATEST(0, behavior_rating - 1) WHERE id = ?", [pId]);
                console.log(`DEBUG: Decremented behavior rating for patient ${pId} due to cancellation.`);
            }
        }

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
            if (status === 'cancelled') {
                // [NEW] If cancelled, delete from Google Calendar to release slot immediately
                try {
                    await googleController.deleteEventHelper(exists[0].doctor_id, exists[0].google_event_id, req.user.user_id);
                    // Optionally clear event ID so we don't try to sync it anymore
                    await conn.query("UPDATE appointments SET google_event_id = NULL WHERE id = ?", [id]);
                } catch (syncErr) {
                    console.warn("Google Sync Failed (Delete on Cancel), queueing retry:", syncErr.message);
                    await conn.query(
                        "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'delete', ?, 'pending')",
                        [id, exists[0].doctor_id, JSON.stringify({ eventId: exists[0].google_event_id })]
                    );
                }
            } else {
                const newDescription = `Motivo: ${exists[0].reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${status}\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

                const updatePayload = {
                    summary: pName,
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
                summary: pName,
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

exports.getNextFreeSlot = async (req, res) => {
    let conn;
    try {
        const { doctor_id, start_date } = req.query;
        if (!doctor_id) return res.status(400).send("Doctor ID is required");

        conn = await pool.getConnection();

        // 1. Get Doctor Config
        const [doc] = await conn.query("SELECT appointment_duration, break_duration FROM doctors WHERE id = ?", [doctor_id]);
        const duration = (doc && doc.length > 0 && doc[0].appointment_duration) ? doc[0].appointment_duration : 60;
        const breakTime = (doc && doc.length > 0 && doc[0].break_duration) ? doc[0].break_duration : 0;
        const startHour = 8;
        const endHour = 20;

        // 2. Setup Loop
        let currentDay = start_date ? new Date(start_date) : new Date();

        // Round up to next slot interval if "now"
        // But for simplicity, let's just ensure we don't return a past time.
        // If "now" is 10:15, and slots are 10:00, 11:00... we should find 11:00.
        // But for this MVP, exact start times:

        // Adjust for current day limits
        if (currentDay.getHours() >= endHour) {
            currentDay.setDate(currentDay.getDate() + 1);
            currentDay.setHours(startHour, 0, 0, 0);
        } else if (currentDay.getHours() < startHour) {
            currentDay.setHours(startHour, 0, 0, 0);
        }

        const maxDays = 60;
        let daysChecked = 0;

        // Trackers
        let foundRegular = null;
        let foundBreak = null;

        while (daysChecked < maxDays) {
            // Check Weekend/Holiday
            // (We iterate days, but now we must check specific schedule for that day)
            const dayOfWeek = currentDay.getDay();

            // Check Holiday
            const dateStr = currentDay.toISOString().split('T')[0];
            const holidays = await conn.query("SELECT id FROM active_holidays WHERE date = ?", [dateStr]);
            if (holidays.length > 0) {
                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0); // Reset to start of day
                daysChecked++;
                continue;
            }

            // Get Schedule for this day
            // If no schedule for this doc, default 8-20 Mon-Fri
            let dayBlocks = await conn.query(
                "SELECT start_time, end_time, is_break FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? ORDER BY start_time",
                [doctor_id, dayOfWeek]
            );

            if (dayBlocks.length === 0) {
                // Apply Default Legacy: Mon-Fri 8-20
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    dayBlocks = [{ start_time: '08:00:00', end_time: '20:00:00', is_break: 0 }];
                }
            }

            if (dayBlocks.length === 0) {
                // No schedule today
                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0);
                daysChecked++;
                continue;
            }

            // Fetch occupied slots (Entire Day to be safe, or min/max of blocks)
            // Let's fetch entire day
            const dayStartQuery = new Date(currentDay); dayStartQuery.setHours(0, 0, 0, 0);
            const dayEndQuery = new Date(currentDay); dayEndQuery.setHours(23, 59, 59, 999);

            const existingAppts = await conn.query(
                "SELECT appointment_date FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? AND status != 'cancelled'",
                [doctor_id, dayStartQuery, dayEndQuery]
            );

            // Iterate Blocks
            for (const block of dayBlocks) {
                // skip if found both
                if (foundRegular && foundBreak) break;

                // Parse block times relative to currentDay
                const blockStart = new Date(currentDay);
                const [sh, sm] = block.start_time.split(':');
                blockStart.setHours(sh, sm, 0, 0);

                const blockEnd = new Date(currentDay);
                const [eh, em] = block.end_time.split(':');
                blockEnd.setHours(eh, em, 0, 0);

                const isBreakBlock = block.is_break === 1;

                // Iterate slots in this block
                let timeCursor = new Date(blockStart);
                while (timeCursor < blockEnd) {
                    if (foundRegular && foundBreak) break;

                    // Check if valid start time (future)
                    if (timeCursor <= new Date()) {
                        timeCursor = new Date(timeCursor.getTime() + duration * 60000);
                        continue;
                    }

                    const slotEnd = new Date(timeCursor.getTime() + duration * 60000);
                    // Must finish before block end? Yes.
                    if (slotEnd > blockEnd) {
                        break; // Move to next block
                    }

                    // Check Conflicts
                    const isBusy = existingAppts.some(app => {
                        const appTime = new Date(app.appointment_date).getTime();
                        // Standard overlap check:
                        // [appStart, appStart+duration) OVERLAPS [timeCursor, slotEnd)
                        // appStart < slotEnd && appStart+duration > timeCursor.
                        // Assuming all appointments are 'duration' length approx, or just strict slot matching.
                        // Existing logic was strict match or simple contain.
                        // Let's stick to strict match for grid alignment if possible, OR simple range check.

                        // Let's use Range check for safety
                        const appStart = new Date(app.appointment_date).getTime();
                        const appEnd = appStart + duration * 60000; // Assume same duration? 
                        // Dangerous assumption if variable durations.
                        // But usually appts are fixed slots.
                        // Let's check strict start time match first as primary grid system
                        return appStart === timeCursor.getTime();
                    });

                    if (!isBusy) {
                        // Google Check
                        const busy = await googleController.checkConflict(doctor_id, timeCursor.toISOString(), slotEnd.toISOString());
                        if (!busy) {
                            if (isBreakBlock) {
                                if (!foundBreak) foundBreak = timeCursor;
                            } else {
                                if (!foundRegular) foundRegular = timeCursor;
                            }
                        }
                    }

                    // Increment
                    // If break block, maybe increment by duration too? 
                    // Or is this a "Gap"?
                    // User said "asignar turno en descanso". So "Break" is just a type of slot.
                    timeCursor = new Date(timeCursor.getTime() + duration * 60000);
                }
            }


            // Move to next day
            currentDay.setDate(currentDay.getDate() + 1);
            currentDay.setHours(0, 0, 0, 0);
            daysChecked++;
        }

        if (foundRegular || foundBreak) {
            return res.json({
                slot: foundRegular,
                breakSlot: foundBreak,
                doctor_id
            });
        }

        res.status(404).json({ message: "No free slots found in next 60 days." });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
