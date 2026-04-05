const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');
const { calculatePrice } = require('../../utils/priceCalculator');
const medicationService = require('./MedicationService');
const financeService = require('../finance/financeService');
const prescriptionRepository = require('../../repositories/prescriptionRepository');
const appointmentRepository = require('../../repositories/appointmentRepository');
const patientRepository = require('../../repositories/patientRepository');
const medicationRepository = require('../../repositories/medicationRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const systemSettingsRepository = require('../../repositories/systemSettingsRepository');

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

            const { appointment_id, medications, instructions, items, bonified } = prescriptionData;
            const userId = req.user.user_id;

            const appt = await appointmentRepository.findById(appointment_id, conn);
            if (!appt) throw new Error("Appointment not found");

            await this._checkOwnership(conn, req.user, appt.doctor_id);

            const prescriptionId = await prescriptionRepository.create({
                appointment_id, medications, instructions, bonified
            }, conn);

            if (items && Array.isArray(items)) {
                await this._processPrescriptionItems(conn, prescriptionId, appt.patient_id, items, userId);
            }

            await this._handleFinancialsAndReminders(conn, appointment_id, appt.doctor_id, appt.patient_id, instructions, userId, req, bonified);

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
        const conn = await pool.getConnection();
        try {
            const prescription = await prescriptionRepository.findById(id, conn);
            if (!prescription) throw new Error("Prescription not found");

            await this._checkPermissions(conn, req.user, prescription.doctor_id, 'enable_secretary_crud_prescriptions');

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

            const existing = await medicationRepository.findActiveByName(patientId, medName, conn);
            if (!existing) {
                const nextRefillDate = medicationService.constructor.calculateNextRefillDate(item.daily_units, item.quantity, item.units_per_box);
                await medicationRepository.create({
                    patient_id: patientId, medication_name: medName, dose: item.dose,
                    frequency: item.frequency, monodroga: item.drug || item.monodroga,
                    presentation: item.presentation, vademecum_id: item.vademecum_id,
                    added_by: userId, next_refill_date: nextRefillDate,
                    units_per_box: item.units_per_box, boxes_count: item.quantity,
                    daily_intake: item.daily_units
                }, conn);
            }
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
            }, userId);
        }

        const doc = await doctorRepository.getDoctorConfig(doctorId, conn);
        const patDoc = await patientRepository.getPrescriptionInterval(patientId, doctorId, conn);
        const interval = patDoc?.prescription_interval_days || doc?.default_prescription_interval_days;

        if (interval > 0) {
            const appt = await appointmentRepository.findById(appointment_id, conn);
            const nextDate = new Date(appt.appointment_date);
            nextDate.setDate(nextDate.getDate() + Number(interval));
            await patientRepository.updatePrescriptionInfo(patientId, nextDate.toISOString().split('T')[0], conn);
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
            const setting = await systemSettingsRepository.findByKey(settingKey, conn);
            if (setting?.setting_value === 'true') return;
        }
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id, conn);
            if (doc && doc.id === doctorId) return;
        }
        throw new Error("Unauthorized");
    }
}

module.exports = new PrescriptionService();
