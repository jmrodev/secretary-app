const { pool } = require('../db');
const userRepository = require('../repositories/userRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const secretaryRepository = require('../repositories/secretaryRepository');
const phoneRepository = require('../repositories/phoneRepository');
const { saveToRecycleBin } = require('../utils/recycleBin');
const bcrypt = require('bcrypt');

/**
 * UserAccountService
 * Handles complex multi-table transactions for user management.
 */
class UserAccountService {
    async createUser(req, userData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { username, password, role, fullName, dni, email, phone, specialty, phoneNumbers } = userData;

            // 1. Create User
            const hash = await bcrypt.hash(password, 10);
            const userId = await userRepository.create({ username, password_hash: hash, role }, conn);

            let profileId;
            if (role === 'doctor') {
                profileId = await doctorRepository.create({ user_id: userId, full_name: fullName, dni, specialty, phone }, conn);
            } else if (role === 'secretary') {
                profileId = await secretaryRepository.create({ user_id: userId, full_name: fullName, dni, phone }, conn);
            } else if (role === 'patient') {
                const { street_name, street_number, floor, apartment, city = 'Tandil', province = 'Buenos Aires', country = 'Argentina' } = userData;
                profileId = await patientRepository.create({
                    user_id: userId, full_name: fullName, dni, phone, email,
                    street_name, street_number, floor, apartment, city, province, country
                }, conn);

                // Removed Google Contact Sync as requested (account is only for appointments)
                // googleContactService.syncContact({ full_name: fullName, dni, phone }).catch(err => console.error("Async Sync Error:", err));
            }

            // 2. Handle Phone Numbers
            if (Array.isArray(phoneNumbers) && profileId) {
                const primaryPhone = await phoneRepository.syncPhones(role, profileId, phoneNumbers, conn);
                if (primaryPhone) {
                    const repo = this._getRepoForRole(role);
                    if (repo) {
                        await repo.updateById ? await repo.updateById(profileId, { phone: primaryPhone }, conn) : await repo.update(profileId, { phone: primaryPhone }, conn);
                    }
                }
            }

            await conn.commit();
            return userId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateUser(userId, userData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { username, role, full_name, dni, phone, specialty, phoneNumbers } = userData;

            // 1. Update User Record
            await userRepository.update(userId, { username, role }, conn);

            let profileId;
            let repo = this._getRepoForRole(role);

            if (role === 'doctor') {
                const p = await doctorRepository.findByUserId(userId, conn);
                profileId = p?.id;
                if (profileId) await doctorRepository.updateById(profileId, { full_name, dni, phone, specialty }, conn);
            } else if (role === 'secretary') {
                const p = await secretaryRepository.findByUserId(userId, conn);
                profileId = p?.id;
                if (profileId) await secretaryRepository.update(profileId, { full_name, dni, phone }, conn);
            } else if (role === 'patient') {
                const p = await patientRepository.findByUserId(userId, conn);
                profileId = p?.id;
                if (profileId) {
                    const { street_name, street_number, floor, apartment, city, province, country, email } = userData;
                    await patientRepository.update(profileId, { full_name, dni, phone, email, street_name, street_number, floor, apartment, city, province, country }, conn);
                }
            }

            // 2. Handle Phone Numbers
            if (phoneNumbers !== undefined && Array.isArray(phoneNumbers) && profileId) {
                const primaryPhone = await phoneRepository.syncPhones(role, profileId, phoneNumbers, conn);
                if (primaryPhone) {
                    if (repo) {
                        await repo.updateById ? await repo.updateById(profileId, { phone: primaryPhone }, conn) : await repo.update(profileId, { phone: primaryPhone }, conn);
                    }
                }
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async deleteUser(req, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Get the user's role and auth data
            const [userRow] = await conn.query("SELECT id, username, role, password_hash FROM users WHERE id = ?", [userId]);
            if (!userRow) throw new Error(`User ${userId} not found`);
            const { role, password_hash, username: oldUsername } = userRow;

            if (role === 'patient') {
                // 2a. Get patient profile
                const profile = await patientRepository.findByUserId(userId, conn);
                if (!profile) throw new Error(`Patient profile not found for user ${userId}`);
                const patientId = profile.id;

                // Collect all related data for the recycle bin snapshot
                const appointments = await conn.query("SELECT * FROM appointments WHERE patient_id = ?", [patientId]);
                const files = await conn.query("SELECT * FROM patient_files WHERE patient_id = ?", [patientId]);
                const medical_requests = await conn.query("SELECT * FROM medical_requests WHERE patient_id = ?", [patientId]);
                const assigned_doctors = await conn.query("SELECT * FROM patient_doctors WHERE patient_id = ?", [patientId]);

                // Save to recycle bin BEFORE deleting
                await saveToRecycleBin(req, 'patient', patientId, profile.full_name, {
                    profile,
                    auth: { username: oldUsername, password_hash }, // Store credentials
                    appointments,
                    files,
                    medical_requests,
                    assigned_doctors
                });

                // Delete in FK-safe order (cascades via ON DELETE CASCADE handle some)
                await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [patientId]);
                await conn.query("DELETE FROM phone_numbers WHERE entity_type = 'patient' AND entity_id = ?", [patientId]);
                await conn.query("DELETE FROM patient_medications WHERE patient_id = ?", [patientId]);
                await conn.query("DELETE FROM patient_files WHERE patient_id = ?", [patientId]);
                // patient_access_tokens and prescription_request_tokens have ON DELETE CASCADE

                // Nullify overwritten_reservations references (no cascade)
                await conn.query("UPDATE overwritten_reservations SET patient_id = NULL WHERE patient_id = ?", [patientId]);

                // Appointments cascade: nullify transactions first, then delete related records
                const appointmentIds = appointments.map(a => a.id);
                if (appointmentIds.length > 0) {
                    const placeholders = appointmentIds.map(() => '?').join(',');
                    await conn.query(`UPDATE transactions SET appointment_id = NULL WHERE appointment_id IN (${placeholders})`, appointmentIds);
                    await conn.query(`DELETE FROM prescriptions WHERE appointment_id IN (${placeholders})`, appointmentIds);
                    await conn.query(`DELETE FROM medical_licenses WHERE appointment_id IN (${placeholders})`, appointmentIds);
                    await conn.query(`DELETE FROM appointments WHERE id IN (${placeholders})`, appointmentIds);
                }

                // Medical requests: nullify linked transactions, then delete requests
                const requestIds = medical_requests.map(r => r.id);
                if (requestIds.length > 0) {
                    const placeholders = requestIds.map(() => '?').join(',');
                    await conn.query(`UPDATE transactions SET request_id = NULL WHERE request_id IN (${placeholders})`, requestIds);
                    await conn.query(`DELETE FROM medical_requests WHERE id IN (${placeholders})`, requestIds);
                }

                // transactions.related_user_id has NO ON DELETE rule — must nullify before deleting user
                await conn.query("UPDATE transactions SET related_user_id = NULL WHERE related_user_id = ?", [userId]);

                // Delete patient profile (user row deleted below)
                await conn.query("DELETE FROM patients WHERE id = ?", [patientId]);

            } else if (role === 'doctor') {
                const profile = await doctorRepository.findByUserId(userId, conn);
                if (profile) {
                    await saveToRecycleBin(req, 'doctor', profile.id, profile.full_name, { profile });
                    // doctor cascades handle: doctor_schedules, doctor_integrations, etc.
                    await conn.query("DELETE FROM doctors WHERE id = ?", [profile.id]);
                }

            } else if (role === 'secretary') {
                const profile = await secretaryRepository.findByUserId(userId, conn);
                if (profile) {
                    await saveToRecycleBin(req, 'secretary', profile.id, profile.full_name, { profile });
                    await conn.query("DELETE FROM secretaries WHERE id = ?", [profile.id]);
                }
            }

            // Finally delete the user row
            await conn.query("DELETE FROM users WHERE id = ?", [userId]);

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    _getRepoForRole(role) {
        switch (role) {
            case 'doctor': return doctorRepository;
            case 'secretary': return secretaryRepository;
            case 'patient': return patientRepository;
            default: return null;
        }
    }
}

module.exports = new UserAccountService();
