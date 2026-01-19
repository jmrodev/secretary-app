const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');

exports.restoreItem = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();

        // 1. Get the recycle bin item
        const [rows] = await conn.query("SELECT * FROM recycle_bin WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Item not found in recycle bin" });

        const item = rows[0];
        const data = JSON.parse(item.data);
        const { entity_type } = item;

        console.log(`[Restore] Restoring ${entity_type} ID: ${item.entity_id}`);

        await conn.beginTransaction();

        if (entity_type === 'patient') {
            await restorePatient(conn, data);
        } else if (entity_type === 'doctor') {
            await restoreDoctor(conn, data);
        } else if (entity_type === 'secretary') {
            await restoreSecretary(conn, data);
        } else if (entity_type === 'medical_request') {
            await restoreMedicalRequest(conn, data);
        } else {
            throw new Error(`Unsupported entity type for restoration: ${entity_type}`);
        }

        // 2. Remove from recycle bin
        await conn.query("DELETE FROM recycle_bin WHERE id = ?", [id]);

        await conn.commit();
        logAction(req, 'RESTORE_ITEM', `Restored ${entity_type} ${item.entity_name} from Recycle Bin`);

        res.json({ message: "Item restored successfully" });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("[Restore Error]", err);
        res.status(500).json({ message: "Failed to restore item: " + err.message });
    } finally {
        if (conn) conn.release();
    }
};

async function restorePatient(conn, data) {
    const { profile, appointments, files, medical_requests, assigned_doctors } = data;

    // 1. Check if User exists (by username). If so, we can't restore simply.
    // Ideally, we check constraints. For now, we try to insert. 
    // If username conflict, we might append timestamp? Let's assume username is unique constraint.

    // However, the original user row is GONE. We need to recreate the USER first.
    // The profile object from 'patients' table has user_id, but that ID might be reused or invalid now?
    // Actually, AUTO_INCREMENT keeps going. We should let new user_id be generated or force it if possible.
    // For simplicity and safety: Re-create User with SAME username if available.

    // We need the password hash. It wasn't in the 'patients' profile.
    // If we didn't backup the 'users' table row, we can't restore the password!
    // FIX: We need to default the password or check if we backed it up.
    // For now, let's set a default temporary password if we don't have it.

    // * CRITICAL: The backup strategy in userController only backed up 'patients' row and related data.
    // It did NOT backup the 'users' row (password, role).
    // We will recreate the user with a default password '123456' and the patient's DNI as username if original is lost.

    // Actually, username is in 'profile.email' or we have to guess?
    // The previous 'deleteUser' logic did: `const [user] = await conn.query("SELECT username, role FROM users ...")`
    // But it didn't save that 'user' object into the JSON backup `fullBackup`.
    // It saved `profile` which is `SELECT * FROM patients`.

    // Let's use DNI as username fallback, and '123456' as password.
    // Or we rely on 'profile.email' if available.

    const username = profile.email || profile.dni || `restored_patient_${Date.now()}`;
    const passwordHash = await bcrypt.hash('123456', 10); // Default password

    // 1. Create User
    const [uRes] = await conn.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'patient')",
        [username, passwordHash]
    );
    const newUserId = uRes.insertId;

    // 2. Create Patient
    // We ignore the old 'id' to avoid Primary Key collisions if we want to be safe, 
    // BUT restoration is best if links are preserved. 
    // If we change patient_ID, all the appointments/files json arrays need their IDs updated.
    // BETTER: Try to force the OLD ID. If it fails (taken), throw error.

    await conn.query(`
        INSERT INTO patients (
            id, user_id, first_name, last_name, full_name, dob, phone, email, address, 
            medical_history, dni, affiliate_number, insurance_id, institution_id, 
            tariff_percent, tariff_override, behavior_rating, is_new_patient, insurance,
            visit_interval_days, prescription_interval_days, next_suggested_visit_date, 
            next_suggested_prescription_date, license_expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        profile.id, newUserId, // Use OLD patient ID (profile.id), but NEW user_id
        profile.first_name, profile.last_name, profile.full_name,
        profile.dob, profile.phone, profile.email, profile.address,
        profile.medical_history, profile.dni, profile.affiliate_number,
        profile.insurance_id, profile.institution_id,
        profile.tariff_percent, profile.tariff_override,
        profile.behavior_rating, profile.is_new_patient, profile.insurance,
        profile.visit_interval_days, profile.prescription_interval_days,
        profile.next_suggested_visit_date, profile.next_suggested_prescription_date,
        profile.license_expiry_date
    ]);

    // 3. Restore Dependents

    // Patient Doctors
    if (assigned_doctors && assigned_doctors.length > 0) {
        for (const pd of assigned_doctors) {
            // Check if doctor still exists
            const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [pd.doctor_id]);
            if (dCheck.length > 0) {
                await conn.query("INSERT IGNORE INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", [profile.id, pd.doctor_id]);
            }
        }
    }

    // Files
    if (files && files.length > 0) {
        for (const f of files) {
            // We need 'uploaded_by'. If that user is gone, set to admin (e.g. 1) or NULL? 
            // Constraint 'uploaded_by' FK to users. Set to newUserId (self) or keep original if exists?
            // Let's verify if original uploader exists.
            let uploader = f.uploaded_by;
            const [uCheck] = await conn.query("SELECT id FROM users WHERE id = ?", [uploader]);
            if (uCheck.length === 0) uploader = newUserId; // Fallback to self

            await conn.query(`
                INSERT INTO patient_files (id, patient_id, uploaded_by, file_name, file_url, file_type, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             `, [f.id, profile.id, uploader, f.file_name, f.file_url, f.file_type, f.description, f.created_at]);
        }
    }

    // Appointments (This is tricky because appointments link to doctors and consultorios)
    if (appointments && appointments.length > 0) {
        for (const app of appointments) {
            // Check doctor
            const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [app.doctor_id]);
            if (dCheck.length === 0) continue; // Skip if doctor doesn't exist

            await conn.query(`
                INSERT INTO appointments (
                    id, patient_id, doctor_id, consultorio_id, appointment_date, reason, status, 
                    cancellation_reason, cost, is_paid, payment_status, google_event_id, 
                    is_out_of_hours, type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                app.id, profile.id, app.doctor_id, app.consultorio_id, app.appointment_date,
                app.reason, app.status, app.cancellation_reason, app.cost, app.is_paid,
                app.payment_status, app.google_event_id, app.is_out_of_hours, app.type, app.created_at
            ]);
        }
    }

    // Medical Requests
    if (medical_requests && medical_requests.length > 0) {
        for (const req of medical_requests) {
            await conn.query(`
                INSERT INTO medical_requests (
                    id, type, patient_id, doctor_id, requires_doctor_approval, secretary_id, 
                    status, request_note, doctor_note, created_at, updated_at, payment_status, 
                    debt_amount, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `, [
                req.id, req.type, profile.id, req.doctor_id, req.requires_doctor_approval,
                req.secretary_id, req.status, req.request_note, req.doctor_note,
                req.created_at, req.updated_at, req.payment_status, req.debt_amount, req.completed_at
            ]);
        }
    }
}

async function restoreDoctor(conn, data) {
    // Similar logic for Doctor if needed... but focus is patient for now as per request?
    // Implementing basic restore for completeness
    const { profile } = data;
    // ... (Simplified: just restore profile + user)
    // Assuming '123456' password
    const passwordHash = await bcrypt.hash('123456', 10);
    const [uRes] = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'doctor')", [profile.full_name.replace(/\s+/g, '.').toLowerCase(), passwordHash]);
    const newUserId = uRes.insertId;

    await conn.query(`INSERT INTO doctors (id, user_id, full_name, specialty, phone) VALUES (?, ?, ?, ?, ?)`,
        [profile.id, newUserId, profile.full_name, profile.specialty, profile.phone]);
}

async function restoreSecretary(conn, data) {
    const { profile } = data;
    const passwordHash = await bcrypt.hash('123456', 10);
    const [uRes] = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'secretary')", [profile.full_name.replace(/\s+/g, '.').toLowerCase(), passwordHash]);
    const newUserId = uRes.insertId;

    await conn.query(`INSERT INTO secretaries (id, user_id, full_name, phone) VALUES (?, ?, ?, ?)`,
        [profile.id, newUserId, profile.full_name, profile.phone]);
}

async function restoreMedicalRequest(conn, reqData) {
    // Check patient existence
    const [pCheck] = await conn.query("SELECT id FROM patients WHERE id = ?", [reqData.patient_id]);
    if (pCheck.length === 0) throw new Error(`Cannot restore request: Patient ID ${reqData.patient_id} not found.`);

    // Check doctor existence (optional but strict)
    if (reqData.doctor_id) {
        const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [reqData.doctor_id]);
        if (dCheck.length === 0) throw new Error(`Cannot restore request: Doctor ID ${reqData.doctor_id} not found.`);
    }

    await conn.query(`
        INSERT INTO medical_requests (
            id, type, patient_id, doctor_id, requires_doctor_approval, secretary_id, 
            status, request_note, doctor_note, secretary_note, created_at, updated_at, payment_status, 
            debt_amount, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        reqData.id, reqData.type, reqData.patient_id, reqData.doctor_id, reqData.requires_doctor_approval,
        reqData.secretary_id, reqData.status, reqData.request_note, reqData.doctor_note, reqData.secretary_note,
        reqData.created_at, reqData.updated_at, reqData.payment_status, reqData.debt_amount, reqData.completed_at
    ]);

    // Restore Debt Transaction if it was pending and we deleted it
    if (reqData.payment_status === 'debt' && reqData.debt_amount > 0) {
        // Create new transaction (ID will change, acceptable)
        const [pUser] = await conn.query("SELECT user_id FROM patients WHERE id = ?", [reqData.patient_id]);
        if (pUser.length > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                ['income_patient', reqData.debt_amount, `Restored Request: ${reqData.type}`, pUser[0].user_id, reqData.doctor_id, 'credit', 'pending', reqData.id]
            );
        }
    }
}
