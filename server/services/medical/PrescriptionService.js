const { pool } = require('../../db');
const { logAction } = require('../../utils/system/audit');
const { calculatePrice } = require('../../utils/finance/priceCalculator');
const medicationService = require('./MedicationService');
const financeService = require('../finance/financeService');
const prescriptionRepository = require('../../repositories/medical/prescriptionRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const medicationRepository = require('../../repositories/medical/medicationRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const userRepository = require('../../repositories/user/userRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const bcrypt = require('bcrypt');

/**
 * PrescriptionService
 * Handles business logic for medical prescriptions linked to appointments.
 */
class PrescriptionService {
    /**
     * Create a new prescription
     */
    async createPrescription(req, prescriptionData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { appointment_id, patient_id, medications, instructions, items, bonified } = prescriptionData;
            const userId = req.user.user_id;

            let appt = null;
            if (appointment_id) {
                appt = await appointmentRepository.findById(appointment_id, conn);
            }

            let targetPatientId = appt?.patient_id || patient_id;
            let targetDoctorId = appt?.doctor_id;

            if (!targetDoctorId && req.user.role === 'doctor') {
                const doc = await doctorRepository.getDoctorConfigByUserId(req.user.user_id, conn);
                if (doc) targetDoctorId = doc.id;
            }

            if (targetDoctorId) {
                await this._checkOwnership(conn, req.user, targetDoctorId);
            }

            let isBonified = bonified;
            if (req.user.role === 'doctor') {
                isBonified = 1; // Recetas emitidas por la médica son siempre bonificadas por defecto
            }

            const prescriptionId = await prescriptionRepository.create({
                appointment_id: appt?.id || null, patient_id: targetPatientId, medications, instructions, bonified: isBonified ? 1 : 0
            }, conn);

            if (items && Array.isArray(items) && targetPatientId) {
                await this._processPrescriptionItems(conn, prescriptionId, targetPatientId, items, userId);
            }

            if (targetPatientId && targetDoctorId) {
                await this._handleFinancialsAndReminders(conn, appt?.id || null, targetDoctorId, targetPatientId, instructions, userId, req, isBonified);
            }

            await conn.commit();
            return prescriptionId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async getPrescriptions(user, filters = {}) {
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
            search: filters.search,
            limit: filters.limit,
            offset: filters.offset
        };

        const [rows, total] = await Promise.all([
            prescriptionRepository.findAll(repoFilters),
            prescriptionRepository.countAll(repoFilters)
        ]);

        return {
            prescriptions: rows,
            totalCount: total
        };
    }

    async updatePrescription(req, id, prescriptionData) {
        const conn = await pool.getConnection();
        try {
            if (req.user.role === 'secretary') {
                const hasPerm = Boolean(req.user.permissions?.can_crud_prescriptions ?? req.user.can_crud_prescriptions);
                if (!hasPerm) {
                    const setting = await systemSettingsRepository.findByKey('enable_secretary_crud_prescriptions', conn);
                    if (!setting || setting.setting_value !== 'true') throw new Error("Unauthorized");
                }
            }

            const { medications, instructions } = prescriptionData;
            const updates = { medications, instructions };

            if (prescriptionData.bonified === 1 || prescriptionData.bonified === true || prescriptionData.bonified === 'true') {
                await financeService.markAsBonified(id, 'prescription', conn);
            }

            await prescriptionRepository.update(id, updates, conn);
            logAction(req, 'UPDATE_PRESCRIPTION', `Prescription ID: ${id}`);
        } finally {
            conn.release();
        }
    }

    async deletePrescription(req, id) {
        const password = req.body?.password || req.body?.adminPassword;
        if (!password) throw new Error("Password required");

        const conn = await pool.getConnection();
        try {
            const currentUser = await userRepository.findById(req.user.user_id, conn);
            if (!currentUser) throw new Error("Unauthorized");

            const isValid = await bcrypt.compare(password, currentUser.password_hash);
            if (!isValid) throw new Error("Invalid password");

            if (req.user.role === 'secretary') {
                const hasPerm = Boolean(req.user.permissions?.can_crud_prescriptions ?? req.user.can_crud_prescriptions);
                if (!hasPerm) {
                    const setting = await systemSettingsRepository.findByKey('enable_secretary_crud_prescriptions', conn);
                    if (!setting || setting.setting_value !== 'true') throw new Error("Unauthorized");
                }
            }

            const prescription = await prescriptionRepository.findById(id, conn);
            if (!prescription) {
                // Si la receta fue guardada como medicación directa de paciente
                await medicationRepository.delete(id, conn);
                logAction(req, 'DELETE_MEDICATION', `Deleted Medication ID: ${id}`);
                return;
            }

            let doctorId = null;
            if (prescription.appointment_id) {
                const appt = await appointmentRepository.findById(prescription.appointment_id, conn);
                if (appt) doctorId = appt.doctor_id;
            }

            if (!doctorId && req.user.role === 'doctor') {
                const doc = await doctorRepository.getDoctorConfigByUserId(req.user.user_id, conn);
                if (doc) doctorId = doc.id;
            }

            if (doctorId) {
                await this._checkOwnership(conn, req.user, doctorId);
            }

            await prescriptionRepository.delete(id, conn);
            logAction(req, 'DELETE_PRESCRIPTION', `Deleted Prescription ID: ${id}`);
        } finally {
            conn.release();
        }
    }

    // --- Private Helpers ---

    async _processPrescriptionItems(conn, prescriptionId, patientId, items, userId) {
        for (const item of items) {
            const medName = item.name || item.medication_name;
            await prescriptionRepository.addItem({
                prescription_id: prescriptionId, ...item, medication_name: medName
            }, conn);
        }
    }

    async _handleFinancialsAndReminders(conn, appointment_id, doctorId, patientId, instructions, userId, req, bonified) {
        const pat = await patientRepository.findById(patientId, conn);
        if (!pat) return;

        const { price } = await calculatePrice(conn, doctorId, patientId, 'prescription');
        if (price > 0 && !bonified) {
            await financeService.createTransaction({
                type: 'income_patient', amount: 0, debt_amount: price,
                description: `Prescription - ${instructions ? instructions.substring(0, 50) : 'General'}`,
                related_user_id: pat.user_id, doctor_id: doctorId,
                appointment_id: appointment_id, status: 'pending'
            }, userId, conn);
        }

        const doc = await doctorRepository.getDoctorConfig(doctorId, conn);
        const patDoc = await patientRepository.getPrescriptionInterval(patientId, doctorId, conn);
        const interval = patDoc?.prescription_interval_days || doc?.default_prescription_interval_days;

        if (interval > 0) {
            let baseDate = new Date();
            if (appointment_id) {
                const appt = await appointmentRepository.findById(appointment_id, conn);
                if (appt && appt.appointment_date) {
                    baseDate = new Date(appt.appointment_date);
                }
            }
            baseDate.setDate(baseDate.getDate() + Number(interval));
            await patientRepository.updatePrescriptionInfo(patientId, baseDate.toISOString().split('T')[0], conn);
        }

        logAction(req, 'CREATE_PRESCRIPTION', `Patient: ${pat.full_name}`);
    }

    async _checkOwnership(conn, user, doctorId) {
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id, conn);
            if (!doc || doc.id !== doctorId) throw new Error("Unauthorized");
        } else if (user.role !== 'admin' && user.role !== 'secretary') {
            throw new Error("Unauthorized");
        }
    }

    async _checkPermissions(conn, user, doctorId, settingKey) {
        if (user.role === 'admin') return;
        if (user.role === 'secretary') {
            const hasPerm = Boolean(user.permissions?.can_crud_prescriptions ?? user.can_crud_prescriptions);
            if (hasPerm) return;
            if (settingKey) {
                const setting = await systemSettingsRepository.findByKey(settingKey, conn);
                if (setting?.setting_value === 'true') return;
            }
        }
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id, conn);
            if (doc && doc.id === doctorId) return;
        }
        throw new Error("Unauthorized");
    }
}

module.exports = new PrescriptionService();
