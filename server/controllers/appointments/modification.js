const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');
const googleController = require('../googleController');
const { validateAdminPassword } = require('./utils');

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

        const now = new Date();
        const apptDate = new Date(appt.appointment_date);
        const apptFormatted = apptDate.toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

        // 3. Check for "Other Completed Actions" (Medical Records)
        const prescriptions = await conn.query("SELECT id FROM prescriptions WHERE appointment_id = ?", [id]);
        const licenses = await conn.query("SELECT id FROM medical_licenses WHERE appointment_id = ?", [id]);

        if (prescriptions.length > 0 || licenses.length > 0) {
            return res.status(400).send("Cannot delete appointment: It has associated medical records (Prescriptions/Licenses).");
        }

        // [NEW] ADMIN OVERRIDE CHECK
        let override = false;
        if (req.body.adminPassword) {
            const isValid = await validateAdminPassword(conn, req.body.adminPassword);
            if (isValid) {
                override = true;
                console.log(`[DeleteAppointment] Admin Override applied for User ${req.user.username}`);
            } else {
                return res.status(403).json({ error: "Contraseña de Administrador incorrecta.", type: 'AUTH_REQUIRED' });
            }
        }

        // 1. Block Deletion of Past Appointments (if not overridden)
        if (!override && req.user.role !== 'admin') {
            if (apptDate < now) {
                if (req.user.role === 'secretary') {
                    const settingRows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_secretary_edit_past_appointments'");
                    const canEditPast = settingRows.length > 0 && (settingRows[0].setting_value === 'true' || settingRows[0].setting_value === '1');
                    if (!canEditPast) {
                        return res.status(403).json({ error: "Requiere autorización de Administrador (Turno Pasado).", type: 'AUTH_REQUIRED' });
                    }
                } else {
                    return res.status(403).send("Cannot delete past appointments.");
                }
            }
        }

        // 2. Block Deletion of Completed/Arrived Appointments (if not overridden)
        if (!override && ['completed', 'attended', 'arrived'].includes(appt.status)) {
            const crudSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_unrestricted_crud'");
            const unrestrictedCrud = crudSetting.length > 0 && (crudSetting[0].setting_value === 'true' || crudSetting[0].setting_value === '1');

            if (!unrestrictedCrud) {
                return res.status(403).json({ error: "Requiere autorización de Administrador (Turno Completado/Atendido).", type: 'AUTH_REQUIRED' });
            }
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

        // [NEW] Add to Recently Freed Slots (DB) - Safe Wrap
        try {
            await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [appt.doctor_id, apptFormatted]);
            await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [appt.doctor_id, apptFormatted]);
        } catch (dbErr) {
            console.warn("[Soft Fail] recently_freed_slots update failed:", dbErr.message);
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
        logAction(req, 'DELETE_APPOINTMENT', `Deleted appointment ID ${id} (Secretary) [Patient: ${loggedName}] [Date: ${apptFormatted}]`);

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
        const { doctor_id, patient_id, appointment_date, reason, type, institution_id, adminPassword } = req.body;

        conn = await pool.getConnection();

        // Check existence
        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        const oldDate = exists[0].appointment_date;
        const oldDateObj = new Date(oldDate);
        const now = new Date();

        let override = false;
        if (adminPassword) {
            const isValid = await validateAdminPassword(conn, adminPassword);
            if (isValid) {
                override = true;
                console.log(`[UpdateAppointment] Admin Override applied for User ${req.user.username}`);
            } else {
                return res.status(403).json({ error: "Contraseña de Administrador incorrecta.", type: 'AUTH_REQUIRED' });
            }
        }

        const updates = {};
        let newStatus = exists[0].status;
        let isReschedule = false;

        if (appointment_date) {
            const apptDate = new Date(appointment_date);
            if (!override && (oldDateObj < now || apptDate < now) && req.user.role !== 'admin') {
                if (req.user.role === 'secretary') {
                    const settingRows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_secretary_edit_past_appointments'");
                    const canEditPast = settingRows.length > 0 && (settingRows[0].setting_value === 'true' || settingRows[0].setting_value === '1');
                    if (!canEditPast) {
                        return res.status(403).json({ error: "Requiere autorización de Administrador (Turno Pasado).", type: 'AUTH_REQUIRED' });
                    }
                } else if (req.user.role === 'patient') {
                    return res.status(400).send("Cannot edit past appointments.");
                }
            }
            if (apptDate.getTime() !== oldDateObj.getTime()) {
                isReschedule = true;
                updates.appointment_date = apptDate;
                newStatus = 'rescheduled';
            }
        }

        if (!override && req.user.role === 'secretary' && ['completed', 'attended', 'arrived'].includes(exists[0].status)) {
            const crudSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_unrestricted_crud'");
            const unrestrictedCrud = crudSetting.length > 0 && (crudSetting[0].setting_value === 'true' || crudSetting[0].setting_value === '1');
            if (!unrestrictedCrud) {
                return res.status(403).json({ error: "Requiere autorización de Administrador (Turno Completado/Atendido).", type: 'AUTH_REQUIRED' });
            }
        }

        if (reason !== undefined) { // Allow reason to be explicitly set to null/empty string
            updates.reason = reason;
        }

        if (type !== undefined) {
            updates.type = type;
        }

        if (doctor_id !== undefined) {
            updates.doctor_id = doctor_id || null;
        }

        if (patient_id !== undefined) {
            updates.patient_id = patient_id || null;
        }

        if (institution_id !== undefined) {
            updates.institution_id = institution_id === 'none' ? null : institution_id;
        }

        if (isReschedule) {
            updates.status = newStatus;
            // [NEW] Add OLD date to Recently Freed Slots logic - Safe Wrap
            try {
                const oldMoment = new Date(oldDate);
                const oldFormatted = oldMoment.toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

                await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [exists[0].doctor_id, oldFormatted]);
                await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [exists[0].doctor_id, oldFormatted]);

                // [NEW] Remove the NEW target slot from Recently Freed if it was there
                const formattedNewDateSafe = new Date(appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');
                await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [exists[0].doctor_id, formattedNewDateSafe]);
            } catch (dbErr) {
                console.warn("[Soft Fail] recently_freed_slots update failed (Reschedule):", dbErr.message);
            }

            // [NEW] Check for Reserved Slot Overwrite on NEW date
            const formattedNewDate = new Date(appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

            const existingReserved = await conn.query(
                "SELECT id, doctor_id, appointment_date, patient_id, status, google_event_id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = 'reserved' AND id != ?",
                [exists[0].doctor_id, formattedNewDate, id] // Don't block self
            );

            if (existingReserved.length > 0) {
                const oldAppt = existingReserved[0];
                const oldPatient = await conn.query("SELECT full_name FROM patients WHERE id = ?", [oldAppt.patient_id]);
                const oldPatientName = oldPatient.length > 0 ? oldPatient[0].full_name : 'Paciente desconocido';

                // 1. Move to overwritten list - Safe Wrap
                try {
                    await conn.query(
                        "INSERT INTO overwritten_reservations (doctor_id, slot_date, patient_id, patient_name) VALUES (?, ?, ?, ?)",
                        [oldAppt.doctor_id, oldAppt.appointment_date, oldAppt.patient_id, oldPatientName]
                    );
                } catch (dbErr) {
                    console.warn("[Soft Fail] overwritten_reservations insert failed (Update):", dbErr.message);
                }

                // 2. Delete the reserved appointment
                await conn.query("DELETE FROM appointments WHERE id = ?", [oldAppt.id]);

                // [NEW] 2b. Delete from Google Calendar if it was synced
                if (oldAppt.google_event_id) {
                    try {
                        await googleController.deleteEventHelper(oldAppt.doctor_id, oldAppt.google_event_id, req.user.user_id);
                        console.log(`[UpdateAppointment] Deleted corresponding Google Event ${oldAppt.google_event_id} for overwritten reservation.`);
                    } catch (syncErr) {
                        console.warn(`[UpdateAppointment] Failed to delete Google Event for overwritten reservation: ${syncErr.message}`);
                    }
                }

                // 3. Log
                await logAction(req.user.user_id, 'RESERVATION_OVERWRITTEN_BY_RESCHEDULE', `Reserva de ${oldPatientName} en ${oldAppt.appointment_date} fue desplazada por reprogramación de turno ID ${id}.`);

                console.log(`[UpdateAppointment] Overwriting reserved slot ${oldAppt.id} due to reschedule of ${id}`);
            }

            // [NEW] Double Booking Check for Reschedule
            const existingSlotVideo = await conn.query(
                "SELECT id, status FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND id != ?",
                [exists[0].doctor_id, formattedNewDate, id] // Don't block self
            );
            if (existingSlotVideo.length > 0) {
                const blocker = existingSlotVideo[0];
                if (blocker.status !== 'reserved' && blocker.status !== 'cancelled' && blocker.status !== 'absent') {
                    return res.status(400).send("Ya existe un turno confirmado en el nuevo horario.");
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(200).json({ message: "No changes detected" });
        }

        const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];

        await conn.query(`UPDATE appointments SET ${setClauses} WHERE id = ?`, values);


        // Log
        logAction(req, 'RESCHEDULE_APPOINTMENT', `Rescheduled Appt ID ${id} from ${oldDate} to ${appointment_date}`);

        res.json({ message: "Appointment updated" });

        // --- Google Calendar Sync ---
        // Prepare data for Sync (Create or Update)
        const finalDoctorId = doctor_id !== undefined ? doctor_id : exists[0].doctor_id;
        const docData = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [finalDoctorId]);
        const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

        const finalDate = appointment_date ? new Date(appointment_date) : new Date(exists[0].appointment_date);
        const startTime = finalDate;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const finalPatientId = patient_id !== undefined ? patient_id : exists[0].patient_id;
        const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [finalPatientId]);
        const pName = pat.length > 0 ? pat[0].full_name : (finalPatientId || 'Turno Manual');
        const pDetails = pat.length > 0 ? pat[0] : {};
        const finalReason = reason !== undefined ? reason : exists[0].reason;

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
                const result = await googleController.updateEventHelper(finalDoctorId, exists[0].google_event_id, eventData, req.user.user_id);
                if (!result) throw new Error("Sync failed (returned null/false)");
            } catch (syncErr) {
                console.warn("Google Sync Failed (Update), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                    [id, finalDoctorId, JSON.stringify({ eventId: exists[0].google_event_id, updates: eventData })]
                );
            }
        } else {
            // --- CREATE MISSING EVENT (Self-Healing) ---
            // Only if future or recent? Let's just create it to ensure consistency if the user is editing it.
            try {
                const result = await googleController.createEventHelper(finalDoctorId, eventData, req.user.user_id);
                if (result && result.id) {
                    await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, id]);
                    console.log(`[Self-Healing] Created missing Google Event for Appt ${id}`);
                }
            } catch (syncErr) {
                console.warn("Google Sync Failed (Create-Healing), queueing retry:", syncErr.message);
                await conn.query(
                    "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'create', ?, 'pending')",
                    [id, finalDoctorId, JSON.stringify(eventData)]
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
        const { status, reason } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'suspended', 'absent', 'rescheduled', 'arrived'];
        if (!validStatuses.includes(status)) return res.status(400).send("Invalid status");

        conn = await pool.getConnection();

        const exists = await conn.query("SELECT * FROM appointments WHERE id = ?", [id]);
        if (exists.length === 0) return res.status(404).send("Appointment not found");

        const appt = exists[0]; // Capture early

        // 1. Database Update
        await conn.query("UPDATE appointments SET status = ?, cancellation_reason = ? WHERE id = ?", [status, reason || null, id]);

        // 2. Post-Update Logic (Next Visit, Reputation, Debt)
        if (status === 'completed') {
            try {
                const intervalRows = await conn.query(`
                    SELECT 
                        COALESCE(p.visit_interval_days, d.default_visit_interval_days) as interval_days,
                        p.id as patient_id, d.id as doctor_id, a.appointment_date
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.id = ?
                `, [id]);

                if (intervalRows.length > 0) {
                    const intervals = intervalRows[0];
                    if (intervals.interval_days > 0) {
                        const appointmentDate = new Date(intervals.appointment_date);
                        const nextDate = new Date(appointmentDate);
                        nextDate.setDate(nextDate.getDate() + Number(intervals.interval_days));
                        const nextDateStr = nextDate.toISOString().split('T')[0];
                        await conn.query("UPDATE patients SET next_suggested_visit_date = ? WHERE id = ?", [nextDateStr, intervals.patient_id]);
                    }
                }
            } catch (err) {
                console.warn("[UpdateStatus] Auto-schedule logic failed:", err.message);
            }
        }

        if (['cancelled', 'absent', 'suspended'].includes(status)) {
            // Recently Freed Slots
            try {
                const apptMoment = new Date(appt.appointment_date);
                const apptFormatted = apptMoment.toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

                await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [appt.doctor_id, apptFormatted]);
                await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [appt.doctor_id, apptFormatted]);
            } catch (dbErr) {
                console.warn("[UpdateStatus] recently_freed_slots update failed:", dbErr.message);
            }

            const isError = reason && (
                reason.toLowerCase().includes('error') ||
                reason.toLowerCase().includes('equivoc') ||
                reason.toLowerCase().includes('prueba')
            );

            // Reputation Check
            if (appt.patient_id && !isError && status === 'absent') {
                await conn.query("UPDATE patients SET behavior_rating = GREATEST(0, behavior_rating - 1) WHERE id = ?", [appt.patient_id]);
            }

            // Cleanup Debt
            if (status === 'cancelled' || status === 'suspended') {
                await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
                await conn.query("UPDATE appointments SET payment_status = 'pending' WHERE id = ? AND payment_status = 'debt'", [id]);
            }
        }

        // 3. Logging
        try {
            const pId = appt.patient_id;
            let pName = 'Unknown';
            if (pId) {
                const pat = await conn.query("SELECT full_name FROM patients WHERE id = ?", [pId]);
                if (pat.length > 0) pName = pat[0].full_name;
            }

            const docData = await conn.query("SELECT full_name FROM doctors WHERE id = ?", [appt.doctor_id]);
            const docName = (docData && docData.length > 0) ? docData[0].full_name : 'Unknown Dr';

            let logMsg = `[Status Change] ${status.toUpperCase()} - Patient: ${pName} [Dr: ${docName}]`;
            if (reason) logMsg += ` [Reason: ${reason}]`;

            logAction(req, 'UPDATE_APPOINTMENT_STATUS', logMsg);
        } catch (logErr) {
            console.warn("[UpdateStatus] Logging failed:", logErr.message);
        }

        // 4. Google Sync
        try {
            // Fetch fresh data for sync description
            const pId = appt.patient_id;
            const pat = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [pId]);
            const pName = pat.length > 0 ? pat[0].full_name : (pId || 'N/A');
            const pDetails = pat.length > 0 ? pat[0] : {};

            const durationRows = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [appt.doctor_id]);
            const durationMinutes = (durationRows && durationRows.length > 0 && durationRows[0].appointment_duration) ? durationRows[0].appointment_duration : 60;

            const startTime = new Date(appt.appointment_date);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${status}\nPago: ${appt.payment_status}\nCreado por Aplicación de Secretaría`;

            const updatePayload = {
                summary: pName,
                description: newDescription,
                status: status,
                paymentStatus: appt.payment_status,
                start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
                end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
            };

            if (appt.google_event_id) {
                if (status === 'cancelled') {
                    await googleController.deleteEventHelper(appt.doctor_id, appt.google_event_id, req.user.user_id);
                    await conn.query("UPDATE appointments SET google_event_id = NULL WHERE id = ?", [id]);
                } else {
                    await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user.user_id);
                }
            } else {
                // Self Healing: Create event if missing (except for cancelled)
                if (status !== 'cancelled') {
                    const result = await googleController.createEventHelper(appt.doctor_id, updatePayload, req.user.user_id);
                    if (result && result.id) {
                        await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, id]);
                    }
                }
            }
        } catch (syncErr) {
            // Non-fatal error for the user request
            console.error("[UpdateStatus] Google Sync error:", syncErr);
        }

        // 5. Send Response (Last step to avoid headers-sent errors)
        res.json({ message: "Status updated" });

    } catch (err) {
        console.error("[UpdateStatus] Critical Error:", err);
        if (!res.headersSent) res.status(500).send("Server Error");
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
                const docRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
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
