const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * RestoreService
 * Handles restoration of items from the Recycle Bin.
 */
class RestoreService {
    async restoreItem(req, id) {
        const conn = await pool.getConnection();
        try {
            const rows = await conn.query("SELECT * FROM recycle_bin WHERE id = ?", [id]);
            if (rows.length === 0) throw new Error("Item not found in recycle bin");

            const item = rows[0];
            const data = JSON.parse(item.data);
            const { entity_type } = item;

            await conn.beginTransaction();

            switch (entity_type) {
                case 'patient':
                    await this._restorePatient(conn, data);
                    break;
                case 'doctor':
                    await this._restoreDoctor(conn, data);
                    break;
                case 'secretary':
                    await this._restoreSecretary(conn, data);
                    break;
                case 'medical_request':
                    await this._restoreMedicalRequest(conn, data);
                    break;
                default:
                    throw new Error(`Unsupported entity type: ${entity_type}`);
            }

            await conn.query("DELETE FROM recycle_bin WHERE id = ?", [id]);
            await conn.commit();
            logAction(req, 'RESTORE_ITEM', `Restored ${entity_type} ${item.entity_name}`);
            return { message: "Item restored successfully" };

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async _restorePatient(conn, data) {
        const { profile, auth, appointments, files, medical_requests, assigned_doctors } = data;
        
        // 1. Restore User Credentials
        const username = auth?.username || profile.email || profile.dni || `restored_patient_${Date.now()}`;
        const passwordHash = auth?.password_hash || await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

        const uRes = await conn.query(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'patient')",
            [username, passwordHash]
        );
        const newUserId = Number(uRes.insertId);

        // 2. Restore Patient Profile
        await conn.query(`
            INSERT INTO patients (
                id, user_id, first_name, last_name, full_name, dob, phone, email,
                medical_history, dni, affiliate_number, insurance_id, institution_id, 
                tariff_percent, tariff_override, behavior_rating, is_new_patient,
                visit_interval_days, prescription_interval_days, next_suggested_visit_date, 
                next_suggested_prescription_date, license_expiry_date,
                street_name, street_number, floor, apartment, city, province, country
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            profile.id, newUserId, profile.first_name, profile.last_name, profile.full_name,
            profile.dob, profile.phone, profile.email,
            profile.medical_history, profile.dni, profile.affiliate_number,
            profile.insurance_id, profile.institution_id,
            profile.tariff_percent, profile.tariff_override,
            profile.behavior_rating, profile.is_new_patient,
            profile.visit_interval_days, profile.prescription_interval_days,
            profile.next_suggested_visit_date, profile.next_suggested_prescription_date,
            profile.license_expiry_date,
            profile.street_name, profile.street_number, profile.floor, profile.apartment,
            profile.city, profile.province, profile.country
        ]);

        // 3. Re-link Transactions that were orphaned
        if (appointments?.length) {
            const apptIds = appointments.map(a => a.id);
            await conn.query("UPDATE transactions SET related_user_id = ? WHERE appointment_id IN (?)", [newUserId, apptIds]);
        }
        if (medical_requests?.length) {
            const reqIds = medical_requests.map(r => r.id);
            await conn.query("UPDATE transactions SET related_user_id = ? WHERE request_id IN (?)", [newUserId, reqIds]);
        }

        if (assigned_doctors?.length) {
            for (const pd of assigned_doctors) {
                const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [pd.doctor_id]);
                if (dCheck.length > 0) {
                    await conn.query("INSERT IGNORE INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", [profile.id, pd.doctor_id]);
                }
            }
        }

        if (files?.length) {
            for (const f of files) {
                let uploader = f.uploaded_by;
                const [uCheck] = await conn.query("SELECT id FROM users WHERE id = ?", [uploader]);
                if (uCheck.length === 0) uploader = newUserId;

                await conn.query(`
                    INSERT INTO patient_files (id, patient_id, uploaded_by, file_name, file_url, file_type, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 `, [f.id, profile.id, uploader, f.file_name, f.file_url, f.file_type, f.description, f.created_at]);
            }
        }

        if (appointments?.length) {
            for (const app of appointments) {
                const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [app.doctor_id]);
                if (dCheck.length === 0) continue;

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

        if (medical_requests?.length) {
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

    async _restoreDoctor(conn, data) {
        const { profile } = data;
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        const username = profile.full_name.replace(/\s+/g, '.').toLowerCase();
        const uRes = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'doctor')", [username, passwordHash]);
        await conn.query(`INSERT INTO doctors (id, user_id, full_name, specialty, phone) VALUES (?, ?, ?, ?, ?)`,
            [profile.id, uRes.insertId, profile.full_name, profile.specialty, profile.phone]);
    }

    async _restoreSecretary(conn, data) {
        const { profile } = data;
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        const username = profile.full_name.replace(/\s+/g, '.').toLowerCase();
        const uRes = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'secretary')", [username, passwordHash]);
        await conn.query(`INSERT INTO secretaries (id, user_id, full_name, phone) VALUES (?, ?, ?, ?)`,
            [profile.id, uRes.insertId, profile.full_name, profile.phone]);
    }

    async _restoreMedicalRequest(conn, reqData) {
        const [pCheck] = await conn.query("SELECT id FROM patients WHERE id = ?", [reqData.patient_id]);
        if (pCheck.length === 0) throw new Error(`Patient ID ${reqData.patient_id} not found.`);

        if (reqData.doctor_id) {
            const [dCheck] = await conn.query("SELECT id FROM doctors WHERE id = ?", [reqData.doctor_id]);
            if (dCheck.length === 0) throw new Error(`Doctor ID ${reqData.doctor_id} not found.`);
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

        if (reqData.payment_status === 'debt' && reqData.debt_amount > 0) {
            const [pUser] = await conn.query("SELECT user_id FROM patients WHERE id = ?", [reqData.patient_id]);
            if (pUser.length > 0) {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                    ['income_patient', reqData.debt_amount, `Restored Request: ${reqData.type}`, pUser[0].user_id, reqData.doctor_id, 'credit', 'pending', reqData.id]
                );
            }
        }
    }
}

module.exports = new RestoreService();
