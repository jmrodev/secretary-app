const { pool } = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const patientAccessTokenRepository = require('../repositories/patientAccessTokenRepository');
const patientRepository = require('../repositories/patientRepository');
const userRepository = require('../repositories/userRepository');

/**
 * TemporaryAccessService
 * Handles generation and verification of temporary access tokens for patients.
 */
class TemporaryAccessService {
    async generateToken(patientId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60000);

        if (patientId) {
            const p = await patientRepository.findById(patientId);
            if (!p) throw new Error("Patient not found");
        }

        await patientAccessTokenRepository.create({
            token,
            patient_id: patientId || null,
            expires_at: expiresAt
        });

        return { token, expiresAt, url: `/patient-access/${token}` };
    }

    async verifyToken(token) {
        const record = await patientAccessTokenRepository.findActiveByToken(token);
        if (!record) throw new Error('Token inválido o expirado');

        let patient = null;
        if (record.patient_id) {
            patient = await patientRepository.findById(record.patient_id);
            // We might need username here too, but findById doesn't return it currently.
            // If needed, we can add a method to patientRepository that joins with users.
            if (patient) {
                // Patient found
            }
            // Let's add findDetailedById to patientRepository if it's missing or update it.
        }

        return { valid: true, isNew: !record.patient_id, patient };
    }

    async completeProfile(token, formData) {
        const conn = await pool.getConnection();
        try {
            const record = await patientAccessTokenRepository.findActiveByToken(token, conn);
            if (!record) throw new Error("Token expired or invalid");

            await conn.beginTransaction();

            if (record.patient_id) {
                await this._updateExistingPatient(conn, record.patient_id, formData);
            } else {
                await this._createNewPatient(conn, formData);
            }

            await patientAccessTokenRepository.delete(record.id, conn);

            await conn.commit();
            return { success: true, message: "Profile updated successfully" };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async _updateExistingPatient(conn, id, data) {
        await patientRepository.update(id, {
            full_name: data.full_name,
            phone: data.phone,
            email: data.email,
            street_name: data.street_name || null,
            street_number: data.street_number || null,
            floor: data.floor || null,
            apartment: data.apartment || null,
            city: data.city || null,
            province: data.province || null,
            country: data.country || null,
            dob: data.dob || null,
            insurance_id: data.insurance_id || null,
            affiliate_number: data.affiliate_number,
            medical_history: data.medical_history
        }, conn);
    }

    async _createNewPatient(conn, data) {
        const existing = await userRepository.findByUsername(data.username, conn);
        if (existing) throw new Error("Username already taken");

        const hash = await bcrypt.hash(data.password, 10);
        const userId = await userRepository.create({
            username: data.username,
            password_hash: hash,
            role: 'patient'
        }, conn);

        await patientRepository.create({
            user_id: userId,
            full_name: data.full_name,
            dni: data.dni,
            phone: data.phone,
            email: data.email,
            street_name: data.street_name || null,
            street_number: data.street_number || null,
            floor: data.floor || null,
            apartment: data.apartment || null,
            city: data.city || 'Tandil',
            province: data.province || 'Buenos Aires',
            country: data.country || 'Argentina',
            dob: data.dob || null,
            insurance_id: data.insurance_id || null,
            affiliate_number: data.affiliate_number,
            behavior_rating: 5
        }, conn);
    }
}

module.exports = new TemporaryAccessService();
