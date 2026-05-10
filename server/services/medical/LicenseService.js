const { pool } = require('../../../db');
const { logAction } = require('../../../utils/system/audit');
const { calculatePrice } = require('../../../utils/finance/priceCalculator');
const financeService = require('../../finance/financeService');
const licenseRepository = require('../../../repositories/medical/licenseRepository');
const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');
const patientRepository = require('../../../repositories/user/patientRepository');
const doctorRepository = require('../../../repositories/user/doctorRepository');
const systemSettingsRepository = require('../../../repositories/system/systemSettingsRepository');

/**
 * LicenseService
 * Handles business logic for Medical Licenses linked to appointments.
 */
class LicenseService {
    /**
     * Create a medical license
     */
    async createLicense(req, licenseData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { appointment_id, start_date, days_duration, diagnosis } = licenseData;
            const appt = await appointmentRepository.findById(appointment_id, conn);
            if (!appt) throw new Error("Appointment not found");

            await this._checkPermissions(conn, req.user, appt.doctor_id);

            await licenseRepository.create({ appointment_id, start_date, days_duration, diagnosis }, conn);

            const patient = await patientRepository.findById(appt.patient_id, conn);
            if (patient) {
                await this._handleFinancials(conn, appointment_id, appt.doctor_id, appt.patient_id, days_duration, patient.user_id, req.user.user_id);
                await this._updateExpiryDate(conn, appt.patient_id, start_date, days_duration);
            }

            await conn.commit();
            logAction(req, 'CREATE_LICENSE', `Patient: ${patient?.full_name || 'Unknown'}, Duration: ${days_duration} days`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async getLicenses(user, filters = {}) {
        let doctorId = filters.doctorId || null;
        let patientId = filters.patientId || null;

        if (user.role === 'patient') {
            const pat = await patientRepository.findByUserId(user.user_id);
            if (pat) patientId = pat.id;
        } else if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id);
            if (doc) doctorId = doc.id;
        }

        const repoFilters = {
            doctor_id: doctorId,
            patient_id: patientId,
            limit: filters.limit,
            offset: filters.offset
        };

        const [rows, total] = await Promise.all([
            licenseRepository.findAll(repoFilters),
            licenseRepository.countAll(repoFilters)
        ]);

        return {
            licenses: rows,
            totalCount: total
        };
    }

    async updateLicense(req, id, licenseData) {
        const conn = await pool.getConnection();
        try {
            const license = await licenseRepository.findById(id, conn);
            if (!license) throw new Error("License not found");

            await this._checkPermissions(conn, req.user, license.doctor_id, 'enable_secretary_crud_licenses');

            const { start_date, days_duration, diagnosis } = licenseData;
            await licenseRepository.update(id, { start_date, days_duration, diagnosis }, conn);
            logAction(req, 'UPDATE_LICENSE', `License ID: ${id}`);
        } finally {
            conn.release();
        }
    }

    async deleteLicense(req, id) {
        const conn = await pool.getConnection();
        try {
            const license = await licenseRepository.findById(id, conn);
            if (!license) throw new Error("License not found");

            await this._checkPermissions(conn, req.user, license.doctor_id, 'enable_secretary_crud_licenses');

            await licenseRepository.delete(id, conn);
            logAction(req, 'DELETE_LICENSE', `Deleted License ID: ${id}`);
        } finally {
            conn.release();
        }
    }

    // --- Private Helpers ---

    async _handleFinancials(conn, apptId, doctorId, patientId, days, patientUserId, userId) {
        const { price } = await calculatePrice(conn, doctorId, patientId, 'medical_license');
        if (price > 0) {
            await financeService.createTransaction({
                type: 'income_patient', amount: 0, debt_amount: price,
                description: `Medical License - ${days} days`,
                related_user_id: patientUserId, doctor_id: doctorId,
                appointment_id: apptId, status: 'pending'
            }, userId, conn);
        }
    }

    async _updateExpiryDate(conn, patientId, startDate, days) {
        const expiry = new Date(new Date(startDate).getTime() + (Number(days) * 24 * 60 * 60 * 1000));
        await patientRepository.updateLicenseInfo(patientId, expiry.toISOString().split('T')[0], conn);
    }

    async _checkPermissions(conn, user, doctorId, settingKey) {
        if (user.role === 'admin') return;
        if (user.role === 'secretary') {
            if (!settingKey) return; // General creation allowed?
            const s = await systemSettingsRepository.findByKey(settingKey, conn);
            if (s?.setting_value === 'true') return;
        }
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id, conn);
            if (doc?.id === doctorId) return;
        }
        throw new Error("Unauthorized");
    }
}

module.exports = new LicenseService();
