const { pool } = require('../../db');
const { logAction } = require('../../utils/system/audit');
const { calculatePrice } = require('../../utils/finance/priceCalculator');
const { saveToRecycleBin } = require('../../utils/system/recycleBin');
const medicalRequestRepository = require('../../repositories/medical/medicalRequestRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const medicationRepository = require('../../repositories/medical/medicationRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const eventBus = require('../../events/eventBus');
const EVENTS = require('../../events/eventConstants');
const financeService = require('../finance/financeService');
const { ROLES } = require('../../constants/roles');

/**
 * MedicalRequestService (ECC Optimized)
 * Orchestrates medical business logic with atomic financial synchronization.
 */
class MedicalRequestService {
    async createRequest(req, data) {
        const { patient_id, patientId, doctor_id, request_note, type, bonified, raw_medication_data, status } = data;
        const finalPatientId = patient_id || patientId;
        const initialStatus = status || (req.user.role === ROLES.DOCTOR ? 'completed' : 'pending');

        const pat = await patientRepository.findById(finalPatientId);
        if (!pat) throw new Error("Patient not found");

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const requestId = await medicalRequestRepository.create({
                type,
                patient_id: finalPatientId,
                doctor_id,
                request_note,
                status: initialStatus,
                raw_medication_data: raw_medication_data ? (typeof raw_medication_data === 'string' ? raw_medication_data : JSON.stringify(raw_medication_data)) : null,
                payment_status: bonified ? 'bonified' : 'pending',
                completed_at: initialStatus === 'completed' ? new Date() : null
            }, conn);

            if (raw_medication_data) {
                await this._processRequestItems(conn, requestId, finalPatientId, raw_medication_data);
            }

            // ECC Improvement: Automatic Debt Generation with Idempotency context
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

    async getRequests(user, filters = {}) {
        let doctorId = filters.doctorId || null;
        if (user.role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user.user_id);
            if (doc) doctorId = doc.id;
        }

        const repoFilters = {
            doctorId,
            patientId: filters.patientId,
            status: filters.status,
            limit: filters.limit,
            offset: filters.offset,
            search: filters.search
        };

        const [rows, total] = await Promise.all([
            medicalRequestRepository.findAll(repoFilters),
            medicalRequestRepository.countAll(repoFilters)
        ]);

        return { requests: rows, totalCount: total };
    }

    async generateRequestDebt(conn, requestId, userId) {
        const reqInfo = await medicalRequestRepository.findDetailedById(requestId, conn);
        if (!reqInfo) return;

        const pricing = await calculatePrice(conn, reqInfo.doctor_id, reqInfo.patient_id, reqInfo.type);

        if (pricing.price > 0) {
            // ECC: High Performance Atomic Transaction
            await financeService.createTransaction({
                type: 'income_request',
                amount: 0,
                debt_amount: pricing.price,
                description: `${reqInfo.type}: ${reqInfo.patient_name}`,
                doctor_id: reqInfo.doctor_id,
                status: 'pending',
                related_user_id: reqInfo.patient_user_id || reqInfo.user_id,
                request_id: requestId,
                idempotency_key: `req_debt_${requestId}`
            }, userId, conn);
        }
    }

    async updateRequestStatus(req, id, statusData) {
        const conn = await pool.getConnection();
        try {
            const { status, doctor_note, secretary_note } = statusData;
            const { role, user_id } = req.user;
            const reqInfo = await medicalRequestRepository.findById(id, conn);
            if (!reqInfo) throw new Error("Request not found");

            await conn.beginTransaction();

            const updates = { status };
            if (doctor_note !== undefined) updates.doctor_note = doctor_note;
            if (secretary_note !== undefined) updates.secretary_note = secretary_note;
            if (status === 'completed' || status === 'rejected') updates.completed_at = new Date();

            await medicalRequestRepository.update(id, updates, conn);

            // Trigger debt if completed
            if (status === 'completed' && reqInfo.payment_status === 'pending') {
                await this.generateRequestDebt(conn, id, user_id);
                await financeService.syncRequestPaymentStatus(id, conn);
            }

            await conn.commit();
            logAction(req, 'UPDATE_REQUEST_STATUS', `Request ID: ${id}, Status: ${status}`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async deleteRequest(req, id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const reqInfo = await medicalRequestRepository.findById(id, conn);
            if (!reqInfo) throw new Error("Request not found");

            await saveToRecycleBin(req, 'medical_requests', id, `Request #${id}`, reqInfo);
            await medicationRepository.deleteByRequestId(id, conn);
            
            // Clean up financial dependencies
            eventBus.emit(EVENTS.MEDICAL_REQUEST_DELETED, { id, conn });
            
            await medicalRequestRepository.delete(id, conn);
            await conn.commit();
            logAction(req, 'DELETE_MEDICAL_REQUEST', `ID: ${id}`);
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async _processRequestItems(conn, requestId, patientId, rawData) {
        const items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!Array.isArray(items)) return;
        for (const item of items) {
            await medicationRepository.createRequestMedication({
                request_id: requestId,
                vademecum_id: item.vademecum_id || null,
                medication_name: item.name || 'Medicamento',
                dose: item.dose,
                quantity: item.quantity || 1
            }, conn);
        }
    }
}

module.exports = new MedicalRequestService();
