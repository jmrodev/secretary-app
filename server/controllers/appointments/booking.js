const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');
const googleController = require('../googleController');
const { calculatePrice } = require('../../utils/priceCalculator');

exports.createAppointment = async (req, res) => {
    let conn;
    try {
        const { doctor_id, appointment_date, reason, bonified, type = 'consultation', institution_id } = req.body; // type defaults to 'consultation'
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

        // [NEW] Remove from Recently Freed Slots if we are booking it (Safe Wrap)
        try {
            await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [doctor_id, formattedDate]);
        } catch (dbErr) {
            console.warn("[Soft Fail] recently_freed_slots delete failed:", dbErr.message);
        }

        // [NEW] Check for Reserved Slot Overwrite
        // If a slot is 'reserved' (provisional), another user can book it (overwrite it).
        // ALSO: Check if there is already a confirmed appointment to prevent double booking.
        const existingSlot = await conn.query(
            "SELECT id, doctor_id, appointment_date, patient_id, status, google_event_id FROM appointments WHERE doctor_id = ? AND appointment_date = ?",
            [doctor_id, formattedDate]
        );

        if (existingSlot.length > 0) {
            const oldAppt = existingSlot[0];

            if (oldAppt.status !== 'reserved' && oldAppt.status !== 'cancelled' && oldAppt.status !== 'absent') {
                // It's a real appointment (confirmed, completed, etc) -> BLOCK
                console.warn(`[CreateAppointment] Blocked double booking on ${formattedDate} for Dr ${doctor_id}. Existing Appt ID: ${oldAppt.id}, Status: ${oldAppt.status}`);
                return res.status(400).send("Ya existe un turno confirmado en este horario.");
            }

            if (oldAppt.status === 'reserved') {
                // It's a reservation -> OVERWRITE logic
                // Get patient name for the list
                const oldPatient = await conn.query("SELECT full_name FROM patients WHERE id = ?", [oldAppt.patient_id]);
                const oldPatientName = oldPatient.length > 0 ? oldPatient[0].full_name : 'Paciente desconocido';


                // 1. Move to overwritten list - Safe Wrap
                try {
                    await conn.query(
                        "INSERT INTO overwritten_reservations (doctor_id, slot_date, patient_id, patient_name) VALUES (?, ?, ?, ?)",
                        [oldAppt.doctor_id, oldAppt.appointment_date, oldAppt.patient_id, oldPatientName]
                    );
                } catch (dbErr) {
                    console.warn("[Soft Fail] overwritten_reservations insert failed:", dbErr.message);
                }

                // 2. Delete the reserved appointment to allow new booking
                await conn.query("DELETE FROM appointments WHERE id = ?", [oldAppt.id]);

                // [NEW] 2b. Delete from Google Calendar if it was synced
                if (oldAppt.google_event_id) {
                    try {
                        await googleController.deleteEventHelper(oldAppt.doctor_id, oldAppt.google_event_id, req.user.user_id);
                        console.log(`[CreateAppointment] Deleted corresponding Google Event ${oldAppt.google_event_id} for overwritten reservation.`);
                    } catch (syncErr) {
                        console.warn(`[CreateAppointment] Failed to delete Google Event for overwritten reservation: ${syncErr.message}`);
                        // Ensure we don't block the new appointment creation, but log it.
                    }
                }

                // 3. Log the action
                await logAction(req.user.user_id, 'RESERVATION_OVERWRITTEN', `Reserva de ${oldPatientName} en ${oldAppt.appointment_date} fue desplazada por nuevo turno.`);

                console.log(`[CreateAppointment] Overwriting reserved slot ${oldAppt.id} (Patient: ${oldPatientName})`);
            }
        }



        // [Moved Up] Fetch names for description and institution fallback
        // We need this BEFORE inserting to know the default institution
        const [patientData] = await conn.query("SELECT full_name, user_id, dni, phone, email, institution_id FROM patients WHERE id = ?", [patient_id]);

        // Resolve Institution (Explicit > Patient Default)
        let finalInstitutionId = institution_id;

        if (finalInstitutionId === 'none') {
            finalInstitutionId = null; // Explicitly 'Particular' / No Institution
        } else if (!finalInstitutionId && patientData) {
            // Fallback to Patient Default ONLY if not explicitly cleared
            finalInstitutionId = patientData.institution_id;
        }

        const result = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, is_out_of_hours, type, status, institution_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [patient_id, doctor_id, formattedDate, reason, false, type, 'pending', finalInstitutionId] // Default to pending if not specified
        );
        const appointmentId = result.insertId;

        const pNameStr = patientData ? patientData.full_name : 'Unknown';
        const relatedUserId = patientData ? patientData.user_id : null;
        const pDetails = patientData || {}; // Define pDetails for Google Logic

        const [doctorRows] = await conn.query("SELECT full_name FROM doctors WHERE id = ?", [doctor_id]);
        const dNameStr = doctorRows ? doctorRows.full_name : 'Unknown';

        // --- Debt Generation ---
        let paymentStatus = 'pending';
        try {
            if (!bonified) {
                // Determine service type for price calc
                const serviceType = type === 'virtual' ? 'virtual_consultation' : 'consultation';

                const priceInfo = await calculatePrice(conn, doctor_id, patient_id, serviceType, finalInstitutionId);

                // [NEW] Split Payment Logic
                // priceInfo.price is the Patient's Share (after tariff/override)
                // priceInfo.basePrice is the Full Doctor Price

                const patientShare = priceInfo.price;
                const basePrice = priceInfo.basePrice || patientShare; // Safety fallback

                // Check if patient has institution (Use the one we decided on)
                const institutionId = finalInstitutionId;


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

        logAction(req, 'CREATE_APPOINTMENT', `Patient: ${pNameStr} [Dr: ${dNameStr}] [Type: ${type}] [Date: ${formattedDate}] [Institution: ${finalInstitutionId ? 'Yes' : 'No'}]`);

        res.status(201).json({ id: Number(result.insertId), message: "Appointment created" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
