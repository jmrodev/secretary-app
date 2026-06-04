const { pool } = require('../../db');

class MedicationRepository {
    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM patient_medications WHERE id = ?", [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    async findByPatientId(patientId, conn = pool) {
        return await conn.query(
            "SELECT * FROM patient_medications WHERE patient_id = ? AND status = 'active' ORDER BY created_at DESC",
            [patientId]
        );
    }

    async findActiveByName(patientId, name, conn = pool) {
        const rows = await conn.query(
            "SELECT * FROM patient_medications WHERE patient_id = ? AND medication_name = ? AND status = 'active'",
            [patientId, name]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    async create(data, conn = pool) {
        const query = `
            INSERT INTO patient_medications 
            (patient_id, medication_name, presentation, monodroga, dose, frequency, is_chronic, added_by, next_refill_date, notes, vademecum_id, reminder_mode, reminder_day, units_per_box, daily_intake, boxes_count, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.patient_id, data.medication_name, data.presentation || null, data.monodroga || null,
            data.dose || null, data.frequency || null, data.is_chronic || 0, data.added_by,
            data.next_refill_date || null, data.notes || null, data.vademecum_id || null,
            data.reminder_mode || 'calculation', data.reminder_day || null,
            data.units_per_box || null, data.daily_intake || null, data.boxes_count || null,
            data.status || 'active'
        ];
        return await conn.query(query, params);
    }

    async update(id, updates, conn = pool) {
        const setClauses = [];
        const params = [];

        let resetNotified = "";
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'next_refill_date' && value !== undefined) {
                resetNotified = ", is_notified = 0";
            }
            setClauses.push(`${key} = ?`);
            params.push(value);
        }

        if (setClauses.length === 0) return 0;

        params.push(id);
        const result = await conn.query(`UPDATE patient_medications SET ${setClauses.join(', ')} ${resetNotified} WHERE id = ?`, params);
        return result.affectedRows;
    }
    async deleteByRequestId(requestId, conn = pool) {
        return await conn.query("DELETE FROM medical_request_items WHERE request_id = ?", [requestId]);
    }

    async createRequestMedication(data, conn = pool) {
        return await conn.query(
            "INSERT INTO medical_request_items (request_id, vademecum_id, medication_name, dose, quantity) VALUES (?, ?, ?, ?, ?)",
            [data.request_id, data.vademecum_id, data.medication_name, data.dose, data.quantity]
        );
    }
}

module.exports = new MedicationRepository();
