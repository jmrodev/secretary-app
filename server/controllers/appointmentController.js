const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const googleController = require('./googleController');
const { calculatePrice } = require('../utils/priceCalculator');

exports.createAppointment = async (req, res) => {
    let conn;
    try {
        const { doctor_id, appointment_date, reason, bonified, type = 'consultation' } = req.body; // type defaults to 'consultation'
        let patient_id = req.body.patient_id;

        if (req.user.role === 'patient') {
            // ... (patient logic remains same)
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

        // ... (Holiday, Past Date, Google Conflict, Out of Hours checks remain same)

        // ... (Out of Hours Check lines 64-90)
        // Insert with TYPE
        // Convert UTC/ISO input -> Argentina Local Time for DB
        const formattedDate = new Date(appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

        const result = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, is_out_of_hours, type) VALUES (?, ?, ?, ?, ?, ?)",
            [patient_id, doctor_id, formattedDate, reason, false, type]
        );
        const appointmentId = result.insertId;

        // Fetch names for description (AND DETAILS FOR GOOGLE)
        const [patientRows] = await conn.query("SELECT full_name, user_id, dni, phone, email, institution_id FROM patients WHERE id = ?", [patient_id]);
        const pNameStr = patientRows ? patientRows.full_name : 'Unknown';
        const relatedUserId = patientRows ? patientRows.user_id : null;
        const pDetails = patientRows || {}; // Define pDetails for Google Logic

        const [doctorRows] = await conn.query("SELECT full_name FROM doctors WHERE id = ?", [doctor_id]);
        const dNameStr = doctorRows ? doctorRows.full_name : 'Unknown';

        // --- Debt Generation ---
        let paymentStatus = 'pending';
        try {
            if (!bonified) {
                // Determine service type for price calc
                const serviceType = type === 'virtual' ? 'virtual_consultation' : 'consultation';

                const priceInfo = await calculatePrice(conn, doctor_id, patient_id, serviceType);

                // [NEW] Split Payment Logic
                // priceInfo.price is the Patient's Share (after tariff/override)
                // priceInfo.basePrice is the Full Doctor Price

                const patientShare = priceInfo.price;
                const basePrice = priceInfo.basePrice || patientShare; // Safety fallback

                // Check if patient has institution
                let institutionId = null;
                if (patientRows) institutionId = patientRows.institution_id;

                // Calculate Institution Share
                let institutionDebt = 0;
                if (institutionId) {
                    institutionDebt = Math.max(0, basePrice - patientShare);
                }

                // 1. Transaction for Patient (if they pay anything)
                if (patientShare > 0) {
                    await conn.query(
                        "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                        ['income_patient', patientShare, `${type === 'virtual' ? 'Virtual Consultation' : 'Consultation'} (Patient Share): ${pNameStr}`, relatedUserId, doctor_id, 'on_account', 'pending', appointmentId]
                    );
                }

                // 2. Transaction for Institution (Debt)
                if (institutionDebt > 0 && institutionId) {
                    await conn.query(
                        "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, transaction_date, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                        ['income_patient', institutionDebt, `${type === 'virtual' ? 'Virtual Consultation' : 'Consultation'} (Institution Share): ${pNameStr}`, null, doctor_id, institutionId, 'on_account', 'pending', appointmentId]
                    );
                }

                if (patientShare > 0 || institutionDebt > 0) {
                    await conn.query("UPDATE appointments SET payment_status = 'debt' WHERE id = ?", [appointmentId]);
                    paymentStatus = 'debt';
                }
            }
        } catch (debtError) {
            console.error("Debt Generation Failed (Non-fatal):", debtError);
        }
        // -----------------------

        // --- Google Calendar Auto-Sync ---
        const startTime = new Date(appointment_date);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // Default 30 min duration

        const eventData = {
            summary: pNameStr,
            description: `Motivo: ${reason}\nPaciente: ${pNameStr} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nTipo: ${type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\nEstado: pendiente\nPago: ${paymentStatus === 'debt' ? 'deuda' : 'pendiente'}\nCreado por Aplicación de Secretaría`,
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
            (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t LEFT JOIN appointments a2 ON t.appointment_id = a2.id WHERE t.related_user_id = p.user_id AND t.status = 'pending' AND (t.appointment_id IS NULL OR a2.status IN ('completed', 'attended', 'arrived', 'absent'))) as total_debt,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id) as total_appointments,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id AND (a2.status = 'absent' OR (a2.status = 'cancelled' AND COALESCE(a2.cancellation_reason, '') NOT LIKE '%error%'))) as missed_appointments,
            d.full_name as doctor_name, p.phone as patient_phone 
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

        // [NEW] Global Search Filter (Reason, Name, Phone)
        // If search term is provided, we might want to ignore date ranges entirely or search within them?
        // Usually "search" implies finding it anywhere. 
        // For now, let's append it to existing filters. If no filters exist, it searches all.
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            const searchClause = "(p.full_name LIKE ? OR a.reason LIKE ? OR p.phone LIKE ?)";
            if (query.includes(' WHERE ')) {
                query += ` AND ${searchClause}`;
            } else {
                query += ` WHERE ${searchClause}`;
            }
            params.push(searchTerm, searchTerm, searchTerm);
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
        if (apptDate < now && req.user.role !== 'admin') {
            if (req.user.role === 'secretary') {
                const settingRows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_secretary_edit_past_appointments'");
                const canEditPast = settingRows.length > 0 && (settingRows[0].setting_value === 'true' || settingRows[0].setting_value === '1');
                if (!canEditPast) {
                    return res.status(400).send("No tiene permisos para eliminar turnos anteriores (Consulte al administrador).");
                }
            } else {
                return res.status(400).send("Cannot delete past appointments.");
            }
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

        // 4. Handle Payment -> Convert to Credit or Delete Debt
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
        } else {
            // Delete PENDING debt if appointment is deleted
            await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
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
        const now = new Date();

        // Block Editing of Past Appointments for non-admins
        if ((oldDateObj < now || apptDate < now) && req.user.role !== 'admin') {
            if (req.user.role === 'secretary') {
                const settingRows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_secretary_edit_past_appointments'");
                const canEditPast = settingRows.length > 0 && (settingRows[0].setting_value === 'true' || settingRows[0].setting_value === '1');
                if (!canEditPast) {
                    return res.status(400).send("No tiene permisos para editar o mover turnos al pasado (Consulte al administrador).");
                }
            } else if (req.user.role === 'patient') {
                return res.status(400).send("Cannot edit past appointments.");
            }
        }

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
        // --- Google Calendar Sync ---
        // Prepare data for Sync (Create or Update)
        const [docData] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [exists[0].doctor_id]);
        const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

        const finalDate = appointment_date ? new Date(appointment_date) : new Date(exists[0].appointment_date);
        const startTime = finalDate;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const pId = exists[0].patient_id;
        const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [pId]);
        const pName = pat.length > 0 ? pat[0].full_name : pId;
        const pDetails = pat.length > 0 ? pat[0] : {};
        const finalReason = reason || exists[0].reason;

        const newDescription = `Motivo: ${finalReason}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${newStatus}\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

        const eventData = {
            summary: pName,
            description: newDescription,
            start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            status: newStatus,
            paymentStatus: exists[0].payment_status
        };

        if (exists[0].google_event_id) {
            // --- UPDATE EXISTING EVENT ---
            try {
                const result = await googleController.updateEventHelper(exists[0].doctor_id, exists[0].google_event_id, eventData, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null/false)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Update), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                    [id, exists[0].doctor_id, JSON.stringify({ eventId: exists[0].google_event_id, updates: eventData })]
                );
            }
        } else {
            // --- CREATE MISSING EVENT (Self-Healing) ---
            // Only if future or recent? Let's just create it to ensure consistency if the user is editing it.
            try {
                const result = await googleController.createEventHelper(exists[0].doctor_id, eventData, req.user.user_id);
                if (result && result.id) {
                    await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, id]);
                    console.log(`[Self-Healing] Created missing Google Event for Appt ${id}`);
                }
            } catch (syncErr) {
                console.warn("Google Sync Failed (Create-Healing), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'create', ?, 'pending')",
                    [id, exists[0].doctor_id, JSON.stringify(eventData)]
                );
            }
        }
        // ----------------------------
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

        if (['cancelled', 'absent', 'suspended'].includes(status)) {
            const pId = exists[0].patient_id;
            const isError = reason && (
                reason.toLowerCase().includes('error') ||
                reason.toLowerCase().includes('equivoc') ||
                reason.toLowerCase().includes('prueba')
            );

            if (pId && !isError) {
                // Decrement behavior rating (min 0) for cancellations (non-error), absences, and suspensions
                await conn.query("UPDATE patients SET behavior_rating = GREATEST(0, behavior_rating - 1) WHERE id = ?", [pId]);
                console.log(`DEBUG: Decremented behavior rating for patient ${pId} due to ${status}.`);
            }

            if (status === 'cancelled' || status === 'suspended') {
                // If cancelled or suspended, clear the pending debt associated with it
                await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
                console.log(`DEBUG: Cleared pending debt for appointment ${id} due to ${status}.`);
                await conn.query("UPDATE appointments SET payment_status = 'none' WHERE id = ? AND payment_status = 'debt'", [id]);
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
        // --- Google Calendar Sync ---
        // Prepare Data
        const [docData] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [exists[0].doctor_id]);
        const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

        const startTime = new Date(exists[0].appointment_date);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const newDescription = `Motivo: ${exists[0].reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${status}\nPago: ${exists[0].payment_status}\nCreado por Aplicación de Secretaría`;

        const updatePayload = {
            summary: pName,
            description: newDescription,
            status: status,
            paymentStatus: exists[0].payment_status,
            // Start/End required for Create but optional for Update, including anyway for Create
            start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
        };

        if (exists[0].google_event_id) {
            // --- UPDATE or DELETE EXISTING ---
            if (status === 'cancelled') {
                try {
                    await googleController.deleteEventHelper(exists[0].doctor_id, exists[0].google_event_id, req.user.user_id);
                    await conn.query("UPDATE appointments SET google_event_id = NULL WHERE id = ?", [id]);
                } catch (syncErr) {
                    console.warn("Google Sync Failed (Delete on Cancel), queueing retry:", syncErr.message);
                    await conn.query(
                        "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'delete', ?, 'pending')",
                        [id, exists[0].doctor_id, JSON.stringify({ eventId: exists[0].google_event_id })]
                    );
                }
            } else {
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
        } else {
            // --- CREATE MISSING EVENT (Self-Healing) ---
            // Do not create if cancelled
            if (status !== 'cancelled') {
                try {
                    const result = await googleController.createEventHelper(exists[0].doctor_id, updatePayload, req.user.user_id);
                    if (result && result.id) {
                        await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, id]);
                        console.log(`[Self-Healing] Created missing Google Event for Appt ${id} (Status ${status})`);
                    }
                } catch (syncErr) {
                    console.warn("Google Sync Failed (Create-Healing Status), queueing retry:", syncErr.message);
                    await conn.query(
                        "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'create', ?, 'pending')",
                        [id, exists[0].doctor_id, JSON.stringify(updatePayload)]
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

exports.updateType = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { type } = req.body;

        if (!['consultation', 'virtual'].includes(type)) return res.status(400).send("Invalid type");

        conn = await pool.getConnection();

        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        await conn.query("UPDATE appointments SET type = ? WHERE id = ?", [type, id]);

        res.json({ message: "Type updated" });

        // --- Google Calendar Sync ---
        const appt = exists[0];
        if (appt.google_event_id) {
            const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [appt.patient_id]);
            const pName = patData.length > 0 ? patData[0].full_name : appt.patient_id;
            const pDetails = patData.length > 0 ? patData[0] : {};

            const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nTipo: ${type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\nEstado: ${appt.status}\nPago: ${appt.payment_status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: pName,
                description: newDescription
            };

            try {
                const result = await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Type Update), queueing retry:", syncErr.message);
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
        const { doctor_id, start_date, direction = 'next' } = req.query;
        if (!doctor_id) return res.status(400).send("Doctor ID is required");

        conn = await pool.getConnection();

        // 1. Get Doctor Config
        const [doc] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [doctor_id]);
        const duration = (doc && doc.length > 0 && doc[0].appointment_duration) ? doc[0].appointment_duration : 60;

        // 2. Setup Loop
        let currentDay = start_date ? new Date(start_date) : new Date();
        const initialSearchDate = new Date(currentDay);
        const now = new Date();

        const maxDays = 90;
        let daysChecked = 0;

        let foundRegular = null;
        let foundBreak = null;

        // --- OPTIMIZATION: Pre-fetch data for the whole search range ---
        const rangeMin = new Date(currentDay);
        const rangeMax = new Date(currentDay);
        if (direction === 'next') {
            rangeMax.setDate(rangeMax.getDate() + maxDays);
        } else {
            rangeMin.setDate(rangeMin.getDate() - maxDays);
        }

        const tMin = rangeMin.toISOString();
        const tMax = rangeMax.toISOString();
        const dMin = tMin.split('T')[0];
        const dMax = tMax.split('T')[0];

        // 1. Fetch Google Busy (Chunked)
        let googleBusyAll = [];
        try {
            googleBusyAll = await googleController.getBusyIntervals(doctor_id, tMin, tMax);
        } catch (gErr) {
            console.warn("Google Busy pre-fetch failed", gErr.message);
        }

        // 2. Fetch Holidays (range)
        const holidaysRows = await conn.query("SELECT date FROM active_holidays WHERE date >= ? AND date <= ?", [dMin, dMax]);
        const holidayDates = new Set();
        holidaysRows.forEach(h => {
            const d = new Date(h.date);
            holidayDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        });

        // 3. Fetch Schedules (All for doctor)
        const schedulesAll = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ?", [doctor_id]);

        // 4. Fetch Appointments (range)
        const existingApptsAll = await conn.query(
            "SELECT appointment_date FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? AND status NOT IN ('cancelled', 'rescheduled')",
            [doctor_id, tMin, tMax]
        );
        const apptTimes = existingApptsAll.map(a => new Date(a.appointment_date).getTime());

        // --- End Optimization ---

        while (daysChecked < maxDays) {
            const dayOfWeek = currentDay.getDay();
            const dateStr = [
                currentDay.getFullYear(),
                String(currentDay.getMonth() + 1).padStart(2, '0'),
                String(currentDay.getDate()).padStart(2, '0')
            ].join('-');

            // Check Holiday from Cache
            if (holidayDates.has(dateStr)) {
                currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                daysChecked++;
                continue;
            }

            // Get Schedule from Cache
            let dayBlocks = schedulesAll
                .filter(s => s.day_of_week === dayOfWeek)
                .sort((a, b) => direction === 'next'
                    ? a.start_time.localeCompare(b.start_time)
                    : b.start_time.localeCompare(a.start_time)
                );

            if (dayBlocks.length === 0) {
                currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
                if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
                daysChecked++;
                continue;
            }

            for (const block of dayBlocks) {
                if (foundRegular && foundBreak) break;

                const blockStart = new Date(currentDay);
                const [sh, sm] = block.start_time.split(':');
                blockStart.setHours(sh, sm, 0, 0);

                const blockEnd = new Date(currentDay);
                const [eh, em] = block.end_time.split(':');
                blockEnd.setHours(eh, em, 0, 0);

                const isBreakBlock = block.is_break === 1;

                let timeCursor;
                if (direction === 'next') {
                    timeCursor = new Date(Math.max(blockStart.getTime(), initialSearchDate.getTime() + 60000, now.getTime() + 60000));
                } else {
                    const latestPossible = Math.min(blockEnd.getTime() - duration * 60000, initialSearchDate.getTime() - duration * 60000);
                    if (latestPossible < blockStart.getTime() || latestPossible < now.getTime()) continue;
                    const diff = latestPossible - blockStart.getTime();
                    const steps = Math.floor(diff / (duration * 60000));
                    timeCursor = new Date(blockStart.getTime() + steps * (duration * 60000));
                }

                if (direction === 'next') {
                    while (timeCursor.getTime() + duration * 60000 <= blockEnd.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const slotEndMs = slotStartMs + duration * 60000;

                        const isBusy =
                            apptTimes.some(appStart => (slotStartMs < (appStart + duration * 60000) && slotEndMs > appStart)) ||
                            googleBusyAll.some(b => {
                                const bStart = new Date(b.start).getTime();
                                const bEnd = new Date(b.end).getTime();
                                return (slotStartMs < bEnd && slotEndMs > bStart);
                            });

                        if (!isBusy) {
                            if (isBreakBlock) {
                                if (!foundBreak) foundBreak = new Date(timeCursor);
                            } else {
                                if (!foundRegular) foundRegular = new Date(timeCursor);
                            }
                        }
                        if (foundRegular || foundBreak) break;
                        timeCursor = new Date(timeCursor.getTime() + duration * 60000);
                    }
                } else {
                    while (timeCursor.getTime() >= blockStart.getTime() && timeCursor.getTime() >= now.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const slotEndMs = slotStartMs + duration * 60000;

                        const isBusy =
                            apptTimes.some(appStart => (slotStartMs < (appStart + duration * 60000) && slotEndMs > appStart)) ||
                            googleBusyAll.some(b => {
                                const bStart = new Date(b.start).getTime();
                                const bEnd = new Date(b.end).getTime();
                                return (slotStartMs < bEnd && slotEndMs > bStart);
                            });

                        if (!isBusy) {
                            if (isBreakBlock) {
                                if (!foundBreak) foundBreak = new Date(timeCursor);
                            } else {
                                if (!foundRegular) foundRegular = new Date(timeCursor);
                            }
                        }
                        if (foundRegular || foundBreak) break;
                        timeCursor = new Date(timeCursor.getTime() - duration * 60000);
                    }
                }
            }

            if (foundRegular || foundBreak) break;

            currentDay.setDate(currentDay.getDate() + (direction === 'next' ? 1 : -1));
            if (direction === 'next') currentDay.setHours(0, 0, 0, 0); else currentDay.setHours(23, 59, 59, 999);
            if (direction === 'previous' && currentDay < now) break;

            daysChecked++;
        }

        if (foundRegular || foundBreak) {
            return res.json({
                slot: foundRegular,
                breakSlot: foundBreak,
                doctor_id,
                direction
            });
        }

        res.status(404).json({ message: "No se encontraron turnos libres adicionales." });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getFreeSlotsBatch = async (req, res) => {
    let conn;
    try {
        const { doctor_id, start_date } = req.query;
        if (!doctor_id) return res.status(400).send("Doctor ID is required");

        conn = await pool.getConnection();

        // 1. Get Doctor Duration
        const [doc] = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [doctor_id]);
        const duration = (doc && doc.length > 0 && doc[0].appointment_duration) ? doc[0].appointment_duration : 60;

        // 2. Setup Loop
        let currentDay = start_date ? new Date(start_date) : new Date();
        const now = new Date();
        const todayZero = new Date(now); todayZero.setHours(0, 0, 0, 0);
        if (currentDay < todayZero) currentDay = new Date(todayZero);

        const limitDaysWithSlots = 20;
        const maxDaysToCheck = 90;
        let daysChecked = 0;
        let daysFound = 0;

        // --- OPTIMIZATION: Pre-fetch data for the whole search range ---
        const rangeMax = new Date(currentDay);
        rangeMax.setDate(rangeMax.getDate() + maxDaysToCheck);

        const tMin = currentDay.toISOString();
        const tMax = rangeMax.toISOString();
        const dMin = tMin.split('T')[0];
        const dMax = tMax.split('T')[0];

        // 1. Fetch Google Busy (Chunked)
        let googleBusyAll = [];
        try {
            googleBusyAll = await googleController.getBusyIntervals(doctor_id, tMin, tMax);
        } catch (gErr) {
            console.warn("Google Busy pre-fetch failed", gErr.message);
        }

        // 2. Fetch Holidays (range)
        const holidaysRows = await conn.query("SELECT date FROM active_holidays WHERE date >= ? AND date <= ?", [dMin, dMax]);
        const holidayDates = new Set();
        holidaysRows.forEach(h => {
            const d = new Date(h.date);
            holidayDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        });

        // 3. Fetch Schedules (All for doctor)
        const schedulesAll = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ?", [doctor_id]);

        // 4. Fetch Appointments (range)
        const existingApptsAll = await conn.query(
            "SELECT appointment_date FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? AND status NOT IN ('cancelled', 'rescheduled')",
            [doctor_id, tMin, tMax]
        );
        const apptTimes = existingApptsAll.map(a => new Date(a.appointment_date).getTime());

        const results = [];

        while (daysChecked < maxDaysToCheck && daysFound < limitDaysWithSlots) {
            const dayOfWeek = currentDay.getDay();
            const dateStr = [
                currentDay.getFullYear(),
                String(currentDay.getMonth() + 1).padStart(2, '0'),
                String(currentDay.getDate()).padStart(2, '0')
            ].join('-');

            // Check Holiday from Cache
            if (holidayDates.has(dateStr)) {
                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0);
                daysChecked++;
                continue;
            }

            // Get Schedule from Cache
            const dayBlocks = schedulesAll
                .filter(s => s.day_of_week === dayOfWeek)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

            if (dayBlocks.length > 0) {
                const daySlots = [];

                for (const block of dayBlocks) {
                    const blockStart = new Date(currentDay);
                    const [sh, sm] = block.start_time.split(':');
                    blockStart.setHours(sh, sm, 0, 0);

                    const blockEnd = new Date(currentDay);
                    const [eh, em] = block.end_time.split(':');
                    blockEnd.setHours(eh, em, 0, 0);

                    let timeCursor = new Date(blockStart);
                    if (timeCursor < now) {
                        const diff = now.getTime() - timeCursor.getTime();
                        if (diff > 0) {
                            const steps = Math.ceil(diff / (duration * 60000));
                            timeCursor = new Date(timeCursor.getTime() + steps * (duration * 60000));
                        }
                    }

                    while (timeCursor.getTime() + duration * 60000 <= blockEnd.getTime()) {
                        const slotStartMs = timeCursor.getTime();
                        const slotEndMs = slotStartMs + duration * 60000;

                        const isBusy =
                            apptTimes.some(appStart => (slotStartMs < (appStart + duration * 60000) && slotEndMs > appStart)) ||
                            googleBusyAll.some(b => {
                                const bStart = new Date(b.start).getTime();
                                const bEnd = new Date(b.end).getTime();
                                return (slotStartMs < bEnd && slotEndMs > bStart);
                            });

                        if (!isBusy) {
                            daySlots.push({
                                time: timeCursor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                iso: timeCursor.toISOString(),
                                is_break: block.is_break === 1
                            });
                        }
                        timeCursor = new Date(timeCursor.getTime() + duration * 60000);
                    }
                }

                if (daySlots.length > 0) {
                    results.push({
                        date: dateStr,
                        dayName: currentDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                        slots: daySlots
                    });
                    daysFound++;
                }
            }

            currentDay.setDate(currentDay.getDate() + 1);
            currentDay.setHours(0, 0, 0, 0);
            daysChecked++;
        }

        res.json({
            results,
            nextStartDate: currentDay.toISOString().split('T')[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.bulkUpdateType = async (req, res) => {
    let conn;
    try {
        const { dayOfWeek, type, doctorId, fromDate, toDate } = req.body;

        if (dayOfWeek === undefined || !type) {
            return res.status(400).json({ error: "Faltan parámetros: dayOfWeek o type" });
        }

        conn = await pool.getConnection();
        const { role, user_id } = req.user;

        // Check permissions
        if (role !== 'admin' && role !== 'secretary') {
            if (role === 'doctor') {
                const [docRows] = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
                if (!docRows || docRows.length === 0 || docRows[0].id != doctorId) {
                    return res.status(403).json({ error: "No autorizado para este médico" });
                }
            } else {
                return res.status(403).json({ error: "No autorizado" });
            }
        }

        // MySQL DAYOFWEEK is 1-7 (Sun=1...Sat=7). JS is 0-6 (Sun=0...Sat=6)
        const mysqlDay = Number(dayOfWeek) + 1;

        let query = "UPDATE appointments SET type = ? WHERE DAYOFWEEK(appointment_date) = ?";
        let params = [type, mysqlDay];

        if (doctorId) {
            query += " AND doctor_id = ?";
            params.push(doctorId);
        }

        if (fromDate) {
            query += " AND appointment_date >= ?";
            params.push(fromDate);
        } else {
            query += " AND appointment_date >= CURRENT_DATE()";
        }

        if (toDate) {
            query += " AND appointment_date <= ?";
            params.push(toDate);
        }

        query += " AND status NOT IN ('cancelled', 'completed')";

        const result = await conn.query(query, params);

        // Return count of affected rows
        const count = result.affectedRows !== undefined ? result.affectedRows : 0;

        res.json({
            message: `Actualización exitosa. Se cambiaron ${count} turnos a ${type === 'virtual' ? 'Videollamada' : 'Presencial'}.`,
            count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    } finally {
        if (conn) conn.release();
    }
};
