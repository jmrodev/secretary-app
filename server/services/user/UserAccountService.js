const { pool } = require('../../db');
const userRepository = require('../../repositories/user/userRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const secretaryRepository = require('../../repositories/user/secretaryRepository');
const phoneRepository = require('../../repositories/system/phoneRepository');
const { saveToRecycleBin } = require('../../utils/system/recycleBin');
const bcrypt = require('bcrypt');

/**
 * UserAccountService
 * Handles complex multi-table transactions for user management.
 */
class UserAccountService {
    /**
     * Lists every secretary account with their permission flags.
     */
    async getSecretaryPermissions() {
        return await userRepository.findSecretaryPermissions();
    }

    /**
     * Gets granular permissions for a single secretary.
     */
    async getSecretaryPermissionsById(userId) {
        const user = await userRepository.findById(userId);
        if (!user || user.role !== 'secretary') {
            const error = new Error('Secretaria no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return await userRepository.getSecretaryPermissions(userId);
    }

    /**
     * Updates granular permissions for a single secretary by user ID.
     */
    async updateSecretaryPermissionsById(userId, permissions) {
        const user = await userRepository.findById(userId);
        if (!user || user.role !== 'secretary') {
            const error = new Error('Secretaria no encontrada');
            error.statusCode = 404;
            throw error;
        }

        // Validate that provided values are boolean
        for (const [key, val] of Object.entries(permissions)) {
            if (typeof val !== 'boolean') {
                const error = new Error(`El valor para '${key}' debe ser un booleano.`);
                error.statusCode = 400;
                throw error;
            }
        }

        await userRepository.updatePermissions(userId, permissions);
        return await userRepository.getSecretaryPermissions(userId);
    }

    /**
     * Grants or revokes can_manage_users for the targeted secretaries
     * (individual ids or grantToAll). Bumps token_version so existing
     * JWTs are evicted and affected users must re-authenticate.
     */
    async updateSecretaryPermissions({ secretaryIds, grantToAll, revoke }) {
        let ids = [];
        if (grantToAll) {
            ids = await userRepository.findSecretaryUserIds();
        } else if (Array.isArray(secretaryIds) && secretaryIds.length > 0) {
            // Defense in depth: keep only finite positive integers
            ids = secretaryIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
        }

        if (ids.length === 0) {
            const error = new Error('No secretary ids provided');
            error.statusCode = 400;
            throw error;
        }

        await userRepository.updateCanManageUsers(ids, !revoke);
    }

    /**
     * Lists every staff account for the admin management table.
     * Secretaries with can_manage_users cannot see admin accounts.
     */
    async getUsersForAdmin(requester) {
        const users = await userRepository.findAllStaff();
        if (requester?.role !== 'admin') {
            return users.filter(u => u.role !== 'admin');
        }
        return users;
    }

    /**
     * Verifies the requester's admin credentials (re-entered password).
     * Throws 401 when the admin account is missing, 403 on mismatch.
     */
    async _verifyAdminCredentials(adminId, adminPassword) {
        const adminUser = await userRepository.findById(adminId);
        if (!adminUser) {
            const error = new Error('Admin no encontrado.');
            error.statusCode = 401;
            throw error;
        }
        const isMatch = await bcrypt.compare(adminPassword, adminUser.password_hash);
        if (!isMatch) {
            const error = new Error('Su contraseña actual es incorrecta.');
            error.statusCode = 403;
            throw error;
        }
        return adminUser;
    }

    /**
     * Resets a user's password. Only an admin may reset another admin's
     * password, so a granted secretary cannot escalate to an admin account.
     */
    async adminResetPassword(userId, newPassword, requester) {
        const target = await userRepository.findById(userId);
        if (target?.role === 'admin' && requester.role !== 'admin') {
            const error = new Error('Solo un administrador puede restablecer la contraseña de otro administrador.');
            error.statusCode = 403;
            throw error;
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userRepository.updatePassword(userId, hashedPassword);
    }

    /**
     * Creates a user after re-verifying the requester's admin credentials.
     * Only an admin may create another admin account.
     */
    async createUser(req, userData) {
        const { adminPassword } = req.body;
        const adminUser = await this._verifyAdminCredentials(req.user.user_id, adminPassword);
        if (userData.role === 'admin' && adminUser.role !== 'admin') {
            const error = new Error('Solo un administrador puede crear cuentas de administrador.');
            error.statusCode = 403;
            throw error;
        }
        return await this._createUserTransaction(req, userData);
    }

    async _createUserTransaction(req, userData) {
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
                        if (repo.updateById) {
                            await repo.updateById(profileId, { phone: primaryPhone }, conn);
                        } else {
                            await repo.update(profileId, { phone: primaryPhone }, conn);
                        }
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

    async updateUser(userId, userData, requester) {
        const target = await userRepository.findById(userId);
        if (target?.role === 'admin' && requester?.role !== 'admin') {
            const error = new Error('Solo un administrador puede modificar cuentas de administrador.');
            error.statusCode = 403;
            throw error;
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { username, role, full_name, dni, phone, specialty, phoneNumbers } = userData;

            // 1. Update User Record
            await userRepository.update(userId, { username, role }, conn);

            let profileId;
            const repo = this._getRepoForRole(role);

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
                        if (repo.updateById) {
                            await repo.updateById(profileId, { phone: primaryPhone }, conn);
                        } else {
                            await repo.update(profileId, { phone: primaryPhone }, conn);
                        }
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

    /**
     * Deletes a user after re-verifying the requester's admin credentials.
     * Only an admin may delete another admin account.
     */
    async deleteUser(req, userId) {
        const { adminPassword } = req.body;
        const adminUser = await this._verifyAdminCredentials(req.user.user_id, adminPassword);
        const target = await userRepository.findById(userId);
        if (target?.role === 'admin' && adminUser.role !== 'admin') {
            const error = new Error('Solo un administrador puede eliminar cuentas de administrador.');
            error.statusCode = 403;
            throw error;
        }
        await this._deleteUserTransaction(req, userId);
    }

    async _deleteUserTransaction(req, userId) {
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
