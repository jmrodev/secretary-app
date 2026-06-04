const { pool } = require('../../db');

/**
 * MedicalExportRepository
 * Handles complex queries for medical data exports.
 */
class MedicalExportRepository {
    async findPrescriptionsForExport(filters, conn = pool) {
        let sqlPr = "SELECT 'direct' as source_type, pr.id, pr.medications, pr.instructions, a.appointment_date as date, " +
                    "d.full_name as doctor_name, p.full_name as patient_name, p.dni as patient_dni, " +
                    "CASE WHEN pr.bonified = 1 THEN 'bonified' ELSE 'paid' END as payment_status, 0 as amount, 'N/A' as payment_method, 'prescription' as request_type " +
                    "FROM prescriptions pr " +
                    "JOIN appointments a ON pr.appointment_id = a.id " +
                    "JOIN doctors d ON a.doctor_id = d.id " +
                    "JOIN patients p ON a.patient_id = p.id " +
                    "WHERE 1=1";
        if (filters.doctorFilterPr) sqlPr += " " + filters.doctorFilterPr;
        if (filters.dateFilterPr) sqlPr += " " + filters.dateFilterPr;

        let sqlReq = "SELECT 'request' as source_type, r.id, r.request_note as medications, r.doctor_note as instructions, r.completed_at as date, " +
                     "d.full_name as doctor_name, p.full_name as patient_name, p.dni as patient_dni, " +
                     "r.payment_status, COALESCE(NULLIF(r.debt_amount, 0), (SELECT amount FROM transactions WHERE request_id = r.id LIMIT 1), 0) as amount, " +
                     "r.payment_method, r.type as request_type " +
                     "FROM medical_requests r " +
                     "JOIN doctors d ON r.doctor_id = d.id " +
                     "JOIN patients p ON r.patient_id = p.id " +
                     "WHERE r.status = 'completed'";
        if (filters.doctorFilterReq) sqlReq += " " + filters.doctorFilterReq;
        if (filters.dateFilterReq) sqlReq += " " + filters.dateFilterReq;

        const sql = "(" + sqlPr + ") UNION ALL (" + sqlReq + ") ORDER BY date DESC";
        return await conn.query(sql, [...(filters.paramsPr || []), ...(filters.paramsReq || [])]);
    }

    async findGenericRequestsForExport(type, filters, conn = pool) {
        let selectCols = type === 'license' 
            ? 'r.request_note as diagnosis, r.doctor_note as days_duration' 
            : 'r.type as certificate_type, r.request_note as description, r.doctor_note as additional_notes';
            
        let sql = "SELECT r.id, " + selectCols + ", " +
                   "r.completed_at as date, d.full_name as doctor_name, p.full_name as patient_name, p.dni as patient_dni, " +
                   "r.payment_status, COALESCE(NULLIF(r.debt_amount, 0), (SELECT amount FROM transactions WHERE request_id = r.id LIMIT 1), 0) as amount, r.payment_method " +
                   "FROM medical_requests r " +
                   "JOIN doctors d ON r.doctor_id = d.id " +
                   "JOIN patients p ON r.patient_id = p.id " +
                   "WHERE r.status = 'completed' AND r.type = ?";
                   
        if (filters.doctorFilterReq) sql += " " + filters.doctorFilterReq;
        if (filters.dateFilterReq) sql += " " + filters.dateFilterReq;
        sql += " ORDER BY r.completed_at DESC";
        
        return await conn.query(sql, [type, ...(filters.paramsReq || [])]);
    }
}

module.exports = new MedicalExportRepository();
