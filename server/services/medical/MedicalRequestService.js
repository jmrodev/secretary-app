const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');
const { calculatePrice } = require('../../utils/priceCalculator');
const { saveToRecycleBin } = require('../../utils/recycleBin');
const medicalRequestRepository = require('../../repositories/medicalRequestRepository');
const patientRepository = require('../../repositories/patientRepository');
const medicationRepository = require('../../repositories/medicationRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const systemSettingsRepository = require('../../repositories/systemSettingsRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const financeService = require('../finance/financeService');
const { ROLES } = require('../../constants/roles');

/**
 * MedicalRequestService
 * Handles business logic for Medical Requests (Certificates, Requests).
 */
class MedicalRequestService {
    async createRequest(req, data) {
        const { patient_id, doctor_id, request_note, type, bonified, raw_medication_data } = data;
        const initialStatus = req.user.role === ROLES.DOCTOR ? 'completed' : 'pending';

        const pat = await patientRepository.findById(patient_id);
        if (!pat) throw new Error("Patient not found");

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const requestId = await medicalRequestRepository.create({
                type,
                patient_id,
                doctor_id,
                request_note,
                status: initialStatus,
                raw_medication_data: raw_medication_data ? (typeof raw_medication_data === 'string' ? raw_medication_data : JSON.stringify(raw_medication_data)) : null,
                payment_status: bonified ? 'bonified' : 'pending',
                completed_at: initialStatus === 'completed' ? new Date() : null
            }, conn);

            if (raw_medication_data) {
                await this._processRequestItems(conn, requestId, patient_id, raw_medication_data, req.user.user_id);
            }

            if (initialStatus === 'completed' && !bonified) {
                await this.generateRequestDebt(conn, requestId, req.user.user_id);
            }

            await conn.commit();
            logAction(req, 'CREATE_MEDICAL_REQUEST', `Type: ${type}, Patient: ${pat.full_name}. ID: ${requestId}`);
            return requestId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async getRequests(user, filters) {
        let doctorId = null;
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id);
            if (doc) doctorId = doc.id;
        }
        return await medicalRequestRepository.findAll({ doctorId, patientId: filters.patientId });
    }

    async updateRequestStatus(req, id, statusData) {
        const conn = await pool.getConnection();
        try {
            const { status, doctor_note, secretary_note } = statusData;
            const { role, user_id } = req.user;

            if ((status === 'rejected' || status === 'consult') && !doctor_note && role === 'doctor') {
                throw new Error("Note is required for this status");
            }

            const reqInfo = await medicalRequestRepository.findById(id, conn);
            if (!reqInfo) throw new Error("Request not found");

            await this._checkPermissions(conn, role, user_id, reqInfo);

            await conn.beginTransaction();

            const updates = { status };
            if (doctor_note !== undefined) updates.doctor_note = doctor_note;
            if (secretary_note !== undefined) updates.secretary_note = secretary_note;
            if (status === 'completed' || status === 'rejected') updates.completed_at = new Date();

            await medicalRequestRepository.update(id, updates, conn);

            if (status === 'completed' && reqInfo.payment_status === 'pending') {
                await this.generateRequestDebt(conn, id, user_id);
                // Sync status to reflect the new debt
                const financeService = require('../finance/financeService');
                await financeService.syncRequestPaymentStatus(id, conn);
            }

            await conn.commit();
            logAction(req, 'UPDATE_REQUEST_STATUS', `Request ID: ${id}, New Status: ${status}`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async updateRequest(req, id, data) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const { role, user_id } = req.user;
            const { type, request_note, doctor_id, raw_medication_data, debt_amount, payment_method, payment_status, regenerate_debt } = data;

            const reqInfo = await medicalRequestRepository.findById(id, conn);
            if (!reqInfo) throw new Error("Request not found");

            await this._checkPermissions(conn, role, user_id, reqInfo);

            const updates = {};
            if (type) updates.type = type;
            if (request_note !== undefined) updates.request_note = request_note;
            if (doctor_id) updates.doctor_id = doctor_id;
            if (raw_medication_data) updates.raw_medication_data = typeof raw_medication_data === 'string' ? raw_medication_data : JSON.stringify(raw_medication_data);
            if (payment_status) updates.payment_status = payment_status;

            if (Object.keys(updates).length > 0) {
                await medicalRequestRepository.update(id, updates, conn);
            }

            if (payment_status === 'bonified') {
                await financeService.markAsBonified(id, 'request', conn);
                if (updates.payment_status) delete updates.payment_status;
            }

            if (raw_medication_data) {
                await medicationRepository.deleteByRequestId(id, conn);
                await this._processRequestItems(conn, id, reqInfo.patient_id, raw_medication_data, user_id);
            }

            if (debt_amount !== undefined) {
                await transactionRepository.updateByRequestId(id, { amount: debt_amount }, conn);
            }
            if (payment_method) {
                await transactionRepository.updateByRequestId(id, { method: payment_method }, conn);
            }

            if (regenerate_debt) {
                await transactionRepository.deletePendingByRequestId(id, conn);
                await this.generateRequestDebt(conn, id, user_id);
            }

            await conn.commit();
            logAction(req, 'UPDATE_MEDICAL_REQUEST', `Updated Request ID: ${id}`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async updateRequestPaymentStatus(id, status) {
        return await medicalRequestRepository.update(id, { payment_status: status });
    }

    async deleteRequest(req, id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const reqInfo = await medicalRequestRepository.findById(id, conn);
            if (!reqInfo) throw new Error("Request not found");

            await this._checkPermissions(conn, req.user.role, req.user.user_id, reqInfo);

            await saveToRecycleBin(req, 'medical_requests', id, `Solicitud #${id}`, reqInfo);
            await medicationRepository.deleteByRequestId(id, conn);
            await transactionRepository.deletePendingByRequestId(id, conn);
            await medicalRequestRepository.delete(id, conn);

            await conn.commit();
            logAction(req, 'DELETE_MEDICAL_REQUEST', `Deleted Request ID: ${id}`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async generateRequestDebt(conn, requestId, userId) {
        const reqInfo = await medicalRequestRepository.findDetailedById(requestId, conn);
        if (!reqInfo) return;

        const pricing = await calculatePrice(conn, reqInfo.doctor_id, reqInfo.patient_id, reqInfo.type);

        if (pricing.price > 0) {
            await transactionRepository.create({
                type: 'income_patient',
                amount: pricing.price,
                description: `${reqInfo.type}: ${reqInfo.patient_name}`,
                doctor_id: reqInfo.doctor_id,
                status: 'pending',
                method: 'cash',
                related_user_id: reqInfo.patient_user_id || reqInfo.user_id, // Need to ensure we use correct ID
                request_id: requestId,
                transaction_date: new Date()
            }, conn);
        }
    }

    async _processRequestItems(conn, requestId, patientId, rawData, userId) {
        const items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!Array.isArray(items)) return;

        for (const item of items) {
            if (item.medication_id) {
                await medicationRepository.createRequestMedication({
                    request_id: requestId,
                    medication_id: item.medication_id,
                    dosage: item.dosage,
                    quantity: item.quantity || 1
                }, conn);
            }
        }
    }

    async _checkPermissions(conn, role, userId, reqInfo) {
        const setting = await systemSettingsRepository.findByKey('enable_secretary_crud_requests', conn);
        const secretaryCanEdit = setting?.setting_value === 'true' || setting?.setting_value === '1';

        if (role === ROLES.SECRETARY && !secretaryCanEdit) {
            throw new Error("Editing requests is currently restricted to administrators and doctors.");
        }

        if (role === ROLES.DOCTOR) {
            const doc = await doctorRepository.getDoctorConfigByUserId(userId, conn);
            if (!doc || doc.id !== reqInfo.doctor_id) {
                throw new Error("You can only manage your own medical requests.");
            }
        }
    }
}

module.exports = new MedicalRequestService();
