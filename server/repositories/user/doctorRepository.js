

/**
 * DoctorRepository
 * Handles data access for doctors and their schedules.
 */
const ALLOWED_FIELDS = [
    "user_id",
    "full_name",
    "specialty",
    "phone",
    "cbu",
    "alias",
    "bio",
    "dni",
    "consultation_price",
    "office_number",
    "rental_type",
    "rental_cost",
    "prescription_price",
    "medical_license_price",
    "certificate_price",
    "virtual_consultation_price",
    "default_visit_interval_days",
    "default_prescription_interval_days",
    "appointment_duration",
    "break_duration",
    "overturn_start_time",
    "overturn_end_time",
    "force_hour_alignment",
    "afip_cuit",
    "afip_cert_path",
    "afip_key_path",
    "afip_enabled",
    "afip_pto_vta",
    "reminder_template",
    "confirmation_template",
    "reminder_virtual_template",
    "confirmation_virtual_template",
    "gemini_context",
    "gemini_history_limit",
    "gemini_model",
    "gemini_api_version",
    "pending_response_template"
];

class DoctorRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll(conn = this.pool) {
        return await conn.query(`
            SELECT d.*, di.spreadsheet_id
            FROM doctors d
            LEFT JOIN doctor_integrations di ON d.id = di.doctor_id
            ORDER BY d.full_name ASC
        `);
    }

    async findFirst(conn = this.pool) {
        const rows = await conn.query("SELECT * FROM doctors LIMIT 1");
        return rows[0] || null;
    }


    async findById(id, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM doctors WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM doctors WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async create(data, conn = this.pool) {
        const filteredData = {};
        for (const key of Object.keys(data)) {
            if (ALLOWED_FIELDS.includes(key)) {
                filteredData[key] = data[key];
            }
        }

        if (Object.keys(filteredData).length === 0) throw new Error('No valid fields provided for creation');

        const fields = Object.keys(filteredData).join(', ');
        const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
        const values = Object.values(filteredData);
        const result = await conn.query(`INSERT INTO doctors (${fields}) VALUES (${placeholders})`, values);
        return Number(result.insertId);
    }

    async updateById(id, updates, conn = this.pool) {
        const filteredUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_FIELDS.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) return null;

        const fields = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates), id];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE id = ?`, values);
    }

    async updateByUserId(userId, updates, conn = this.pool) {
        const filteredUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_FIELDS.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) return null;

        const fields = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates), userId];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE user_id = ?`, values);
    }

    /**
     * Get doctor configuration
     */
    async getDoctorConfig(doctorId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id, user_id, full_name, appointment_duration, overturn_start_time, overturn_end_time, force_hour_alignment, default_prescription_interval_days FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    async getDoctorConfigByUserId(userId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id, user_id, full_name, appointment_duration, overturn_start_time, overturn_end_time, force_hour_alignment, default_prescription_interval_days FROM doctors WHERE user_id = ?",
            [userId]
        );
        return rows[0] || null;
    }

    async findPrices(doctorId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT consultation_price, prescription_price, medical_license_price, virtual_consultation_price, certificate_price FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    /**
     * Get doctor schedules
     */
    async getDoctorSchedules(doctorId, conn = this.pool) {
        return await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ?",
            [doctorId]
        );
    }

    /**
     * Get schedule for a specific day
     */
    async getDoctorScheduleForDay(doctorId, dayOfWeek, conn = this.pool) {
        return await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?",
            [doctorId, dayOfWeek]
        );
    }

    async findAfipSettings(doctorId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id, afip_cuit, afip_pto_vta, afip_enabled, afip_cert_path, afip_key_path FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    async findDniByAppointmentId(appointmentId, conn = this.pool) {
        const rows = await conn.query(`
            SELECT p.dni FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?
        `, [appointmentId]);
        return rows[0] || null;
    }

    async updateAfipSettings(doctorId, updates, conn = this.pool) {
        const filteredUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_FIELDS.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) return null;

        const fields = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates), doctorId];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE id = ?`, values);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new DoctorRepository(defaultPool);
const factory = (customPool) => new DoctorRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
