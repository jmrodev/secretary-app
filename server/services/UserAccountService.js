const { pool } = require('../db');
const userRepository = require('../repositories/userRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const secretaryRepository = require('../repositories/secretaryRepository');
const phoneRepository = require('../repositories/phoneRepository');
const googleContactService = require('./google/GoogleContactService');
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
                const { street_name, street_number, floor, apartment, city = 'Tandil', province = 'Buenos Aires', country = 'Argentina', address } = userData;
                profileId = await patientRepository.create({
                    user_id: userId, full_name: fullName, dni, phone, email, address,
                    street_name, street_number, floor, apartment, city, province, country
                }, conn);

                // Sync to Google
                googleContactService.syncContact({ full_name: fullName, dni, phone }).catch(err => console.error("Async Sync Error:", err));
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
                    const { street_name, street_number, floor, apartment, city, province, country, address, email } = userData;
                    await patientRepository.update(profileId, { full_name, dni, phone, address, email, street_name, street_number, floor, apartment, city, province, country }, conn);
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
