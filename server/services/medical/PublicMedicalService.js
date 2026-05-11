const { pool } = require('../../../db');
const { calculatePrice } = require('../../../utils/finance/priceCalculator');
const crypto = require('crypto');
const prescriptionRequestTokenRepository = require('../../../repositories/system/prescriptionRequestTokenRepository');
const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');
const doctorRepository = require('../../../repositories/user/doctorRepository');
const patientRepository = require('../../../repositories/user/patientRepository');
const medicalRequestRepository = require('../../../repositories/medical/medicalRequestRepository');
const transactionRepository = require('../../../repositories/finance/transactionRepository');

/**
 * PublicMedicalService
 * Handles business logic for public-facing prescription requests.
 */
class PublicMedicalService {
    async generatePrescriptionRequestToken(patientId, doctorId) {
        let finalDoctorId = doctorId;
        if (!finalDoctorId) {
            const lastAppointment = await appointmentRepository.findLastByPatientId(patientId);
            if (lastAppointment) {
                finalDoctorId = lastAppointment.doctor_id;
            } else {
                const firstDoctor = await doctorRepository.findFirst();
                if (firstDoctor) finalDoctorId = firstDoctor.id;
            }
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 48 * 60 * 60000); // 48 hours

        await prescriptionRequestTokenRepository.create({
            patient_id: patientId,
            doctor_id: finalDoctorId || null,
            token,
            expires_at: expiresAt
        });

        return { token, url: `/p/request-recipe/${token}`, expiresAt };
    }

    async getPublicPrescriptionRequestData(token) {
        const tokenData = await prescriptionRequestTokenRepository.findActiveByToken(token);
        if (!tokenData) throw new Error("invalid_or_expired_token");

        const patient = await patientRepository.findById(tokenData.patient_id);
        if (!patient) throw new Error("patient_not_found");

        const historyRows = await patientRepository.findRecentMedications(tokenData.patient_id);

        const medSet = new Set();
        historyRows.forEach(row => {
            if (!row.name) return;
            const parts = row.name.split(/[,\n;]/);
            parts.forEach(p => {
                const trimmed = p.trim();
                if (trimmed && trimmed.length > 2) medSet.add(trimmed);
            });
        });

        return {
            patientName: patient.full_name,
            recentMeds: Array.from(medSet).slice(0, 15),
            doctorId: tokenData.doctor_id
        };
    }

    async submitPublicPrescriptionRequest(token, requestData) {
        const conn = await pool.getConnection();
        try {
            const { medications, notes, doctorId } = requestData;
            if (!medications || medications.length === 0) throw new Error("medications_required");

            const tokenData = await prescriptionRequestTokenRepository.findActiveByToken(token, conn);
            if (!tokenData) throw new Error("invalid_or_expired_token");

            let finalDoctorId = doctorId || tokenData.doctor_id;
            if (!finalDoctorId) {
                const lastApp = await appointmentRepository.findLastByPatientId(tokenData.patient_id, conn);
                finalDoctorId = lastApp ? lastApp.doctor_id : null;
                if (!finalDoctorId) {
                    const firstDoc = await doctorRepository.findFirst(conn);
                    finalDoctorId = firstDoc ? firstDoc.id : null;
                }
            }

            if (!finalDoctorId) throw new Error("doctor_assignment_failed");

            await conn.beginTransaction();

            const medList = Array.isArray(medications) ? medications : [medications];
            const medString = medList.map(m => (typeof m === 'string' ? m : m.name)).join(', ');
            const rawMeds = medList.map(m => {
                if (typeof m === 'string') return { name: m, dose: '', frequency: '', quantity: '' };
                return {
                    name: m.name || m.medication_name,
                    dose: m.dose || '',
                    frequency: m.frequency || '',
                    quantity: m.quantity || ''
                };
            });

            const combinedNote = `[Patient Request] ${medString}${notes ? '\nNotes: ' + notes : ''}`;

            const requestId = await medicalRequestRepository.create({
                type: 'prescription',
                patient_id: tokenData.patient_id,
                doctor_id: finalDoctorId,
                request_note: combinedNote,
                status: 'pending',
                raw_medication_data: JSON.stringify(rawMeds),
                is_patient_submitted: true
            }, conn);

            // Generate debt
            try {
                const priceInfo = await calculatePrice(conn, finalDoctorId, tokenData.patient_id, 'prescription');
                if (priceInfo && priceInfo.price > 0) {
                    const pat = await patientRepository.findById(tokenData.patient_id, conn);
                    if (pat) {
                        await transactionRepository.create({
                            type: 'income_patient',
                            amount: priceInfo.price,
                            description: `Public Request: prescription for ${pat.full_name}`,
                            related_user_id: pat.user_id,
                            doctor_id: finalDoctorId,
                            method: 'cash',
                            status: 'pending',
                            transaction_date: new Date(),
                            request_id: requestId
                        }, conn);
                        await medicalRequestRepository.update(requestId, {
                            payment_status: 'debt',
                            debt_amount: priceInfo.price
                        }, conn);
                    }
                }
            } catch (e) {
                console.error("Error generating auto-debt for public request:", e);
            }

            // Sync items
            if (rawMeds.length > 0) {
                for (const item of rawMeds) {
                    if (item.name) {
                        await medicalRequestRepository.addItem({
                            request_id: requestId,
                            medication_name: item.name,
                            dose: item.dose || null,
                            frequency: item.frequency || null,
                            quantity: item.quantity || null,
                            status: 'pending'
                        }, conn);
                    }
                }
            }

            await prescriptionRequestTokenRepository.markAsUsed(tokenData.id, conn);

            await conn.commit();
            return { success: true, message: "request_submitted_successfully" };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = new PublicMedicalService();
