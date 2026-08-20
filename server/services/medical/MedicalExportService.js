const medicalExportRepository = require('../../repositories/medical/medicalExportRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const patientRepository = require('../../repositories/user/patientRepository');

/**
 * MedicalExportService
 * Handles legacy export logic for prescriptions, licenses, and certificates.
 */
class MedicalExportService {
    async exportPrescriptionsJSON(user, query) {
        const filters = await this._buildFilters(user, query);
        const rows = await medicalExportRepository.findPrescriptionsForExport(filters);

        // Prescriptions module is isolated from finances by design (same as
        // licenses/certificates). The balance report owns financial data.
        return {
            prescriptions: rows
        };
    }

    async exportLicensesJSON(user, query) {
        return await this._exportGenericRequestJSON(user, query, 'license');
    }

    async exportCertificatesJSON(user, query) {
        return await this._exportGenericRequestJSON(user, query, 'certificate');
    }

    // --- Private Helpers ---

    async _exportGenericRequestJSON(user, query, type) {
        const filters = await this._buildFilters(user, query);
        const rows = await medicalExportRepository.findGenericRequestsForExport(type, filters);
        return { [type === 'license' ? 'licenses' : 'certificates']: rows || [] };
    }

    async _buildFilters(user, query) {
        const { role, user_id } = user;
        const { month, year, doctorId } = query;

        let doctorFilterPr = "", doctorFilterReq = "";
        let dateFilterPr = "", dateFilterReq = "";
        let paramsPr = [], paramsReq = [];

        if (role === 'doctor') {
            const doctor = await doctorRepository.findByUserId(user_id);
            if (doctor) {
                doctorFilterPr = "AND a.doctor_id = ?";
                doctorFilterReq = "AND r.doctor_id = ?";
                paramsPr.push(doctor.id);
                paramsReq.push(doctor.id);
            }
        } else if (doctorId) {
            doctorFilterPr = "AND a.doctor_id = ?";
            doctorFilterReq = "AND r.doctor_id = ?";
            paramsPr.push(doctorId);
            paramsReq.push(doctorId);
        }

        if (role === 'patient') {
            const patient = await patientRepository.findByUserId(user_id);
            if (patient) {
                doctorFilterPr += " AND a.patient_id = ?";
                doctorFilterReq += " AND r.patient_id = ?";
                paramsPr.push(patient.id);
                paramsReq.push(patient.id);
            }
        }

        if (month && year) {
            dateFilterPr = "AND MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?";
            dateFilterReq = "AND MONTH(r.completed_at) = ? AND YEAR(r.completed_at) = ?";
            paramsPr.push(month, year);
            paramsReq.push(month, year);
        }

        return { doctorFilterPr, doctorFilterReq, dateFilterPr, dateFilterReq, paramsPr, paramsReq };
    }
}

module.exports = new MedicalExportService();
