
const { buildUpdateQuery } = require('../../utils/core/sqlUtils');

/**
 * LicenseRepository
 * Handles data access for medical licenses.
 */
class LicenseRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query(`
            SELECT ml.*, a.doctor_id, a.patient_id 
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
            WHERE ml.id = ?`, [id]);
        return rows[0] || null;
    }

    async findAll(filters = {}, conn = this.pool) {
        let query = `
            SELECT ml.*, a.appointment_date, d.full_name as doctor_name, 
            p.full_name as patient_name, p.dni as patient_dni,
            CONCAT_WS(' ', p.street_name, p.street_number,
                IF(p.floor IS NOT NULL AND p.floor != '', CONCAT('Piso ', p.floor), NULL),
                IF(p.apartment IS NOT NULL AND p.apartment != '', CONCAT('Dto. ', p.apartment), NULL)
            ) as patient_address 
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN patients p ON a.patient_id = p.id
        `;
        let params = [];
        let whereClauses = [];

        if (filters.doctor_id) {
            whereClauses.push("a.doctor_id = ?");
            params.push(filters.doctor_id);
        }
        if (filters.patient_id) {
            whereClauses.push("a.patient_id = ?");
            params.push(filters.patient_id);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        query += " ORDER BY a.appointment_date DESC";

        if (filters.limit !== undefined && filters.offset !== undefined) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(filters.limit), parseInt(filters.offset));
        }

        return await conn.query(query, params);
    }

    async countAll(filters = {}, conn = this.pool) {
        let query = `
            SELECT COUNT(*) as total 
            FROM medical_licenses ml
            JOIN appointments a ON ml.appointment_id = a.id
        `;
        let params = [];
        let whereClauses = [];

        if (filters.doctor_id) {
            whereClauses.push("a.doctor_id = ?");
            params.push(filters.doctor_id);
        }
        if (filters.patient_id) {
            whereClauses.push("a.patient_id = ?");
            params.push(filters.patient_id);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        const rows = await conn.query(query, params);
        return rows[0].total;
    }

    async create(data, conn = this.pool) {
        const result = await conn.query(
            "INSERT INTO medical_licenses (appointment_id, start_date, days_duration, diagnosis) VALUES (?, ?, ?, ?)",
            [data.appointment_id, data.start_date, data.days_duration, data.diagnosis || '']
        );
        return result.insertId;
    }

    async update(id, updates, conn = this.pool) {
        const { setClauses, values: updateValues } = buildUpdateQuery('licenses', updates);
        if (!setClauses) return 0;
        const params = [...updateValues, id];
        return await conn.query(`UPDATE medical_licenses SET ${setClauses} WHERE id = ?`, params);
    }

    async delete(id, conn = this.pool) {
        return await conn.query("DELETE FROM medical_licenses WHERE id = ?", [id]);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new LicenseRepository(defaultPool);
const factory = (customPool) => new LicenseRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
