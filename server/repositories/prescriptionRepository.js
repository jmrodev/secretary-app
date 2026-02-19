const { pool } = require('../db');

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
            p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address 
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
        return await conn.query(query, params);
    }

    async create(data, conn = pool) {
        const result = await conn.query(
            "INSERT INTO prescriptions (appointment_id, medications, instructions) VALUES (?, ?, ?)",
            [data.appointment_id, data.medications || '', data.instructions]
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
        const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const params = [...Object.values(updates), id];
        const result = await conn.query(`UPDATE prescriptions SET ${setClauses} WHERE id = ?`, params);
        return result.affectedRows;
    }

    async delete(id, conn = pool) {
        const result = await conn.query("DELETE FROM prescriptions WHERE id = ?", [id]);
        return result.affectedRows;
    }
}

module.exports = new PrescriptionRepository();
