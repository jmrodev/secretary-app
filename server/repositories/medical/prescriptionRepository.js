
const { buildUpdateQuery } = require('../../utils/core/sqlUtils');

/**
 * PrescriptionRepository
 * Handles data access for medical prescriptions.
 */
class PrescriptionRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query(`
            SELECT 
                pr.id, pr.appointment_id, a.patient_id as patient_id,
                pr.medications, pr.instructions, pr.bonified, pr.created_at,
                a.doctor_id, a.appointment_date 
            FROM prescriptions pr
            LEFT JOIN appointments a ON pr.appointment_id = a.id
            WHERE pr.id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    async create(data, conn = this.pool) {
        if (data.patient_id) {
            const result = await conn.query(
                "INSERT INTO prescriptions (appointment_id, patient_id, medications, instructions, bonified) VALUES (?, ?, ?, ?, ?)",
                [data.appointment_id || null, data.patient_id, data.medications || '', data.instructions || '', data.bonified || false]
            );
            return result.insertId;
        }
        const result = await conn.query(
            "INSERT INTO prescriptions (appointment_id, medications, instructions, bonified) VALUES (?, ?, ?, ?)",
            [data.appointment_id || null, data.medications || '', data.instructions || '', data.bonified || false]
        );
        return result.insertId;
    }

    async findAll(filters = {}, conn = this.pool) {
        let query = `
            SELECT pr.*, 
            a.appointment_date, 
            COALESCE(d.full_name, 'Sin Médico') as doctor_name, 
            p.full_name as patient_name, p.dni as patient_dni,
            CONCAT_WS(' ', p.street_name, p.street_number,
                IF(p.floor IS NOT NULL AND p.floor != '', CONCAT('Piso ', p.floor), NULL),
                IF(p.apartment IS NOT NULL AND p.apartment != '', CONCAT('Dto. ', p.apartment), NULL)
            ) as patient_address 
            FROM prescriptions pr
            LEFT JOIN appointments a ON pr.appointment_id = a.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
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

        if (filters.search) {
            whereClauses.push("(p.full_name LIKE ? OR p.dni LIKE ? OR pr.medications LIKE ?)");
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        query += " ORDER BY pr.created_at DESC, a.appointment_date DESC";

        if (filters.limit !== undefined && filters.offset !== undefined) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(filters.limit), parseInt(filters.offset));
        }

        return await conn.query(query, params);
    }

    async countAll(filters = {}, conn = this.pool) {
        let query = `
            SELECT COUNT(*) as total 
            FROM prescriptions pr
            LEFT JOIN appointments a ON pr.appointment_id = a.id
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
        if (filters.search) {
            whereClauses.push("(p.full_name LIKE ? OR p.dni LIKE ? OR pr.medications LIKE ?)");
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        const rows = await conn.query(query, params);
        return rows[0].total;
    }

    async addItem(itemData, conn = this.pool) {
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

    async update(id, updates, conn = this.pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const { setClauses, values: updateValues } = buildUpdateQuery('prescriptions', updates);
        if (!setClauses) return 0;
        const params = [...updateValues, id];
        const result = await conn.query(`UPDATE prescriptions SET ${setClauses} WHERE id = ?`, params);
        return result.affectedRows;
    }

    async delete(id, conn = this.pool) {
        await conn.query("DELETE FROM prescription_items WHERE prescription_id = ?", [id]);
        const result = await conn.query("DELETE FROM prescriptions WHERE id = ?", [id]);
        return result.affectedRows;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new PrescriptionRepository(defaultPool);
const factory = (customPool) => new PrescriptionRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
