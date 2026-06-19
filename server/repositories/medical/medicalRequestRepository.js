

/**
 * MedicalRequestRepository
 * Handles data access for medical requests (certificates, requests, etc).
 */
const ALLOWED_UPDATES = [
    'type', 'patient_id', 'doctor_id', 'secretary_id',
    'status', 'request_note', 'doctor_note', 'secretary_note', 'payment_status',
    'payment_method', 'debt_amount', 'completed_at',
    'raw_medication_data', 'is_patient_submitted'
];

class MedicalRequestRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll(filters = {}, conn = this.pool) {
        let query = `
            SELECT r.*
            FROM v_medical_request_details r
        `;
        const params = [];
        const whereClauses = [];

        if (filters.patientId) { whereClauses.push("r.patient_id = ?"); params.push(filters.patientId); }
        if (filters.doctorId) {
            whereClauses.push("(r.doctor_id = ? OR r.doctor_id IS NULL)");
            params.push(filters.doctorId);
        }
        if (filters.status) {
            const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
            const expandedStatus = [...statusArray];
            if (statusArray.includes('completed')) expandedStatus.push('completado');
            if (statusArray.includes('pending')) expandedStatus.push('pendiente');
            if (statusArray.includes('rejected')) expandedStatus.push('rechazado');
            if (statusArray.includes('consult')) expandedStatus.push('consulta');

            whereClauses.push(`r.status IN (${expandedStatus.map(() => '?').join(',')})`);
            params.push(...expandedStatus);
        }
        if (filters.search) {
            const term = `%${filters.search}%`;
            whereClauses.push("(p.full_name LIKE ? OR d.full_name LIKE ?)");
            params.push(term, term);
        }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += " ORDER BY r.created_at DESC";

        if (filters.limit) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
        }

        return await conn.query(query, params);
    }

    async countAll(filters = {}, conn = this.pool) {
        let query = `SELECT COUNT(*) as total FROM medical_requests r
            LEFT JOIN patients p ON r.patient_id = p.id
            LEFT JOIN doctors d ON r.doctor_id = d.id`;
        const params = [];
        const whereClauses = [];

        if (filters.patientId) { whereClauses.push("r.patient_id = ?"); params.push(filters.patientId); }
        if (filters.doctorId) {
            whereClauses.push("(r.doctor_id = ? OR r.doctor_id IS NULL)");
            params.push(filters.doctorId);
        }
        if (filters.status) {
            const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
            const expandedStatus = [...statusArray];
            if (statusArray.includes('completed')) expandedStatus.push('completado');
            if (statusArray.includes('pending')) expandedStatus.push('pendiente');
            if (statusArray.includes('rejected')) expandedStatus.push('rechazado');
            if (statusArray.includes('consult')) expandedStatus.push('consulta');

            whereClauses.push(`r.status IN (${expandedStatus.map(() => '?').join(',')})`);
            params.push(...expandedStatus);
        }
        if (filters.search) {
            const term = `%${filters.search}%`;
            whereClauses.push("(p.full_name LIKE ? OR d.full_name LIKE ?)");
            params.push(term, term);
        }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        
        const [row] = await conn.query(query, params);
        return row?.total || 0;
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findDetailedById(id, conn = this.pool) {
        const rows = await conn.query(`
            SELECT r.*
            FROM v_medical_request_details r
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    }

    async create(data, conn = this.pool) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const result = await conn.query(`INSERT INTO medical_requests (${fields}) VALUES (${placeholders})`, values);
        return result.insertId;
    }

    async update(id, updates, conn = this.pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;

        const validUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_UPDATES.includes(key)) {
                validUpdates[key] = updates[key];
            }
        }

        if (Object.keys(validUpdates).length === 0) return 0;

        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), id];
        return await conn.query(`UPDATE medical_requests SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = this.pool) {
        return await conn.query("DELETE FROM medical_requests WHERE id = ?", [id]);
    }

    async addItem(data, conn = this.pool) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        return await conn.query(`INSERT INTO medical_request_items (${fields}) VALUES (${placeholders})`, values);
    }

    async getPatientMedicalHistory(patientId, conn = this.pool) {
        return await conn.query(`
            (SELECT p.id, p.created_at, 'prescription' as type, d.full_name as doctor_name, p.medications as diagnosis, NULL as days
             FROM prescriptions p JOIN appointments a ON p.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
            UNION
            (SELECT ml.id, ml.created_at, 'license' as type, d.full_name as doctor_name, ml.diagnosis, ml.days_duration as days
             FROM medical_licenses ml JOIN appointments a ON ml.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
            ORDER BY created_at DESC`, [patientId, patientId]);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new MedicalRequestRepository(defaultPool);
const factory = (customPool) => new MedicalRequestRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
