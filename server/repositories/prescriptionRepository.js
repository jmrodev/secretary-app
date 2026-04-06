const { pool } = require('../db');
const { buildUpdateQuery } = require('../utils/sqlUtils');

/**
 * PrescriptionRepository
 * Handles data access for medical prescriptions.
 */
class PrescriptionRepository {
    async findById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT pr.*, a.doctor_id, a.patient_id, a.appointment_date 
            FROM prescriptions pr
            JOIN appointments a ON pr.appointment_id = a.id
            WHERE pr.id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    async findAll(filters = {}, conn = pool) {
        let query = `
            SELECT pr.*, a.appointment_date, d.full_name as doctor_name, 
            p.full_name as patient_name, p.dni as patient_dni,
            CONCAT_WS(' ', p.street_name, p.street_number,
                IF(p.floor IS NOT NULL AND p.floor != '', CONCAT('Piso ', p.floor), NULL),
                IF(p.apartment IS NOT NULL AND p.apartment != '', CONCAT('Dto. ', p.apartment), NULL)
            ) as patient_address 
            FROM prescriptions pr
            JOIN appointments a ON pr.appointment_id = a.id
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

    async countAll(filters = {}, conn = pool) {
        let query = `
            SELECT COUNT(*) as total 
            FROM prescriptions pr
            JOIN appointments a ON pr.appointment_id = a.id
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

    async create(data, conn = pool) {
        const result = await conn.query(
            "INSERT INTO prescriptions (appointment_id, medications, instructions, bonified) VALUES (?, ?, ?, ?)",
            [data.appointment_id, data.medications || '', data.instructions, data.bonified || false]
        );
        return result.insertId;
    }

    async addItem(itemData, conn = pool) {
        const query = `
            INSERT INTO prescription_items 
            (prescription_id, vademecum_id, medication_name, presentation, monodroga, dose, frequency, duration, quantity, daily_intake, units_per_box) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            itemData.prescription_id, itemData.vademecum_id || null, itemData.medication_name,
            itemData.presentation || null, itemData.monodroga || null, itemData.dose || null,
            itemData.frequency || null, itemData.duration || null, itemData.quantity || null,
            itemData.daily_intake || null, itemData.units_per_box || null
        ];
        return await conn.query(query, params);
    }

    async update(id, updates, conn = pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const { setClauses, values: updateValues } = buildUpdateQuery('prescriptions', updates);
        if (!setClauses) return 0;
        const params = [...updateValues, id];
        const result = await conn.query(`UPDATE prescriptions SET ${setClauses} WHERE id = ?`, params);
        return result.affectedRows;
    }

    async delete(id, conn = pool) {
        const result = await conn.query("DELETE FROM prescriptions WHERE id = ?", [id]);
        return result.affectedRows;
    }
}

module.exports = new PrescriptionRepository();
