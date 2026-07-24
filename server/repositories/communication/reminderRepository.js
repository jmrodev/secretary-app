

/**
 * ReminderRepository
 * Handles complex queries for patient reminders.
 */
class ReminderRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findPendingReminders(doctorId = null, conn = this.pool) {
        let query = `
            SELECT DISTINCT p.id, p.full_name, p.phone, p.dni,
            d.full_name as doctor_name,
            p.next_suggested_visit_date, p.visit_notified,
            p.next_suggested_prescription_date, p.prescription_notified,
            p.license_expiry_date, p.license_notified,
            (SELECT GROUP_CONCAT(medication_name SEPARATOR ', ') FROM patient_medications WHERE patient_id = p.id AND next_refill_date <= CURRENT_DATE) as expiring_meds,
            (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM patient_medications WHERE patient_id = p.id AND next_refill_date <= CURRENT_DATE) as expiring_med_ids,
            (SELECT MIN(is_notified) FROM patient_medications WHERE patient_id = p.id AND next_refill_date <= CURRENT_DATE) as meds_all_notified_min
            FROM patients p
            INNER JOIN patient_doctors pd ON p.id = pd.patient_id
            INNER JOIN doctors d ON pd.doctor_id = d.id
            WHERE (p.next_suggested_visit_date IS NOT NULL AND p.next_suggested_visit_date <= CURRENT_DATE)
               OR (p.next_suggested_prescription_date IS NOT NULL AND p.next_suggested_prescription_date <= CURRENT_DATE)
               OR (p.license_expiry_date IS NOT NULL AND p.license_expiry_date <= CURRENT_DATE)
               OR EXISTS (SELECT 1 FROM patient_medications WHERE patient_id = p.id AND next_refill_date <= CURRENT_DATE)
        `;

        let params = [];
        if (doctorId) {
            query += " AND pd.doctor_id = ?";
            params.push(doctorId);
        }
        return await conn.query(query, params);
    }

    async updatePatientReminder(patientId, field, value, conn = this.pool) {
        return await conn.query(`UPDATE patients SET ${field} = ? WHERE id = ?`, [value, patientId]);
    }

    async clearPatientReminder(patientId, dateField, notifiedField, conn = this.pool) {
        return await conn.query(`UPDATE patients SET ${dateField} = NULL, ${notifiedField} = 0 WHERE id = ?`, [patientId]);
    }

    async updateMedicationReminders(medIds, notified, conn = this.pool) {
        const val = notified ? 1 : 0;
        return await conn.query("UPDATE patient_medications SET is_notified = ? WHERE id IN (?)", [val, medIds]);
    }

    async clearMedicationReminders(medIds, conn = this.pool) {
        return await conn.query("UPDATE patient_medications SET next_refill_date = NULL, is_notified = 0 WHERE id IN (?)", [medIds]);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new ReminderRepository(defaultPool);
const factory = (customPool) => new ReminderRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
