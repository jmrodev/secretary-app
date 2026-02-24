const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const userRepository = require('../repositories/userRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const secretaryRepository = require('../repositories/secretaryRepository');
const phoneRepository = require('../repositories/phoneRepository');

/**
 * AuthService
 * Handles business logic for user registration and authentication.
 */
class AuthService {
    async register(req, registrationData) {
        const conn = await pool.getConnection();
        try {
            const { username, password, role, fullName } = registrationData;
            if (!(username && password && role && fullName)) throw new Error('All input is required');

            const validRoles = ['admin', 'secretary', 'doctor', 'patient'];
            if (!validRoles.includes(role)) throw new Error('Invalid role');

            await conn.beginTransaction();

            const existingUser = await userRepository.findByUsername(username, conn);
            if (existingUser) throw new Error('User already exists');

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = await userRepository.create({ username, password_hash: hashedPassword, role }, conn);

            let profileId = null;
            if (role === 'doctor') {
                await doctorRepository.create({
                    user_id: userId,
                    full_name: fullName,
                    specialty: registrationData.specialty || null,
                    phone: registrationData.phone || null,
                    cbu: registrationData.cbu || null,
                    dni: registrationData.dni || null
                }, conn);
            } else if (role === 'secretary') {
                await secretaryRepository.create({
                    user_id: userId,
                    full_name: fullName,
                    phone: registrationData.phone || null,
                    dni: registrationData.dni || null
                }, conn);
            } else if (role === 'patient') {
                profileId = await this._createPatientProfile(conn, userId, registrationData);
            }

            const token = this._generateToken(userId, username, role, 0);

            await conn.commit();
            logAction({ body: { username }, ip: req.ip }, 'REGISTER', `New user: ${username} as ${role}`);

            return { user_id: userId, username, role, token, patient_id: profileId };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async login(req, credentials) {
        const { username, password } = credentials;
        if (!(username && password)) throw new Error("All input is required");

        const user = await userRepository.findByUsername(username);
        if (!user) throw new Error("Invalid Credentials");

        if (!(await bcrypt.compare(password, user.password_hash))) throw new Error("Invalid Credentials");

        const token = this._generateToken(user.id, username, user.role, user.token_version);
        const name = await this._getDisplayName(user);

        logAction({ user: { user_id: user.id, username: user.username }, ip: req.ip }, 'LOGIN', 'Success');

        return { user_id: user.id, username: user.username, role: user.role, token, name };
    }

    // --- Private Helpers ---

    _generateToken(userId, username, role, version) {
        return jwt.sign(
            { user_id: userId, username, role, token_version: version },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
    }

    async _getDisplayName(user) {
        let name = user.username;
        try {
            let profile;
            if (user.role === 'secretary') profile = await secretaryRepository.findByUserId(user.id);
            else if (user.role === 'doctor') profile = await doctorRepository.findByUserId(user.id);
            else if (user.role === 'patient') profile = await patientRepository.findByUserId(user.id);

            if (profile) name = profile.full_name;
        } catch (e) {
            console.error("Error fetching display name", e);
        }
        return name;
    }

    async _createPatientProfile(conn, userId, data) {
        const firstName = data.first_name || data.fullName;
        const lastName = data.last_name || '';
        const patientId = await patientRepository.create({
            user_id: userId,
            full_name: data.fullName,
            first_name: firstName,
            last_name: lastName,
            dob: data.dob || null,
            phone: data.phone || null,
            medical_history: data.medicalHistory || null,
            dni: data.dni || null,
            insurance_id: data.insurance_id || null,
            institution_id: data.institution_id || null,
            affiliate_number: data.affiliate_number || null,
            street_name: data.street_name || null,
            street_number: data.street_number || null,
            floor: data.floor || null,
            apartment: data.apartment || null,
            city: data.city || 'Tandil',
            province: data.province || 'Buenos Aires',
            country: data.country || 'Argentina'
        }, conn);

        if (Array.isArray(data.phoneNumbers) && data.phoneNumbers.length > 0) {
            const primaryPhone = await phoneRepository.syncPhones('patient', patientId, data.phoneNumbers, conn);
            if (primaryPhone) await patientRepository.update(patientId, { phone: primaryPhone }, conn);
        } else if (data.phone) {
            await phoneRepository.syncPhones('patient', patientId, [{ phone_number: data.phone, is_primary: 1, label: 'Celular' }], conn);
        }
        return patientId;
    }
}

module.exports = new AuthService();
