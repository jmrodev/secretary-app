const { pool } = require('../db');

/**
 * DoctorRepository
 * Handles data access for doctors and their schedules.
 */

const VALID_DOCTOR_COLUMNS = new Set([
    'user_id', 'full_name', 'specialty', 'phone', 'cbu', 'alias', 'bio', 'dni',
    'consultation_price', 'office_number', 'rental_type', 'rental_cost',
    'prescription_price', 'medical_license_price', 'certificate_price',
    'virtual_consultation_price', 'default_visit_interval_days',
    'default_prescription_interval_days', 'appointment_duration',
    'break_duration', 'overturn_start_time', 'overturn_end_time',
    'force_hour_alignment', 'afip_cuit', 'afip_cert_path', 'afip_key_path',
    'afip_enabled', 'afip_pto_vta', 'reminder_template', 'confirmation_template',
    'reminder_virtual_template', 'confirmation_virtual_template'
]);

class DoctorRepository {

    async findAll(conn = pool) {
        return await conn.query(`
            SELECT d.*, di.spreadsheet_id
            FROM doctors d
            LEFT JOIN doctor_integrations di ON d.id = di.doctor_id
            ORDER BY d.full_name ASC
        `);
    }

    async findFirst(conn = pool) {
        const rows = await conn.query("SELECT * FROM doctors LIMIT 1");
        return rows[0] || null;
    }


    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM doctors WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = pool) {
        const rows = await conn.query("SELECT * FROM doctors WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const validData = {};
        for (const [key, value] of Object.entries(data)) {
            if (VALID_DOCTOR_COLUMNS.has(key)) {
                validData[key] = value;
            }
        }

        if (Object.keys(validData).length === 0) {
            throw new Error('No valid columns provided for doctor creation');
        }

        const fields = Object.keys(validData).join(', ');
        const placeholders = Object.keys(validData).map(() => '?').join(', ');
        const values = Object.values(validData);

        const result = await conn.query(`INSERT INTO doctors (${fields}) VALUES (${placeholders})`, values);
        return Number(result.insertId);
    }

    async updateById(id, updates, conn = pool) {
        const validUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (VALID_DOCTOR_COLUMNS.has(key)) {
                validUpdates[key] = value;
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return; // Nothing to update
        }

        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), id];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE id = ?`, values);
    }

    async updateByUserId(userId, updates, conn = pool) {
        const validUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (VALID_DOCTOR_COLUMNS.has(key)) {
                validUpdates[key] = value;
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return; // Nothing to update
        }

        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), userId];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE user_id = ?`, values);
    }

    /**
     * Get doctor configuration
     */
    async getDoctorConfig(doctorId, conn = pool) {
        const rows = await conn.query(
            "SELECT id, user_id, full_name, appointment_duration, overturn_start_time, overturn_end_time, force_hour_alignment, default_prescription_interval_days FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    async getDoctorConfigByUserId(userId, conn = pool) {
        const rows = await conn.query(
            "SELECT id, user_id, full_name, appointment_duration, overturn_start_time, overturn_end_time, force_hour_alignment, default_prescription_interval_days FROM doctors WHERE user_id = ?",
            [userId]
        );
        return rows[0] || null;
    }

    async findPrices(doctorId, conn = pool) {
        const rows = await conn.query(
            "SELECT consultation_price, prescription_price, medical_license_price, virtual_consultation_price, certificate_price FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    /**
     * Get doctor schedules
     */
    async getDoctorSchedules(doctorId, conn = pool) {
        return await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ?",
            [doctorId]
        );
    }

    /**
     * Get schedule for a specific day
     */
    async getDoctorScheduleForDay(doctorId, dayOfWeek, conn = pool) {
        return await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?",
            [doctorId, dayOfWeek]
        );
    }

    async findAfipSettings(doctorId, conn = pool) {
        const rows = await conn.query(
            "SELECT id, afip_cuit, afip_pto_vta, afip_enabled, afip_cert_path, afip_key_path FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || null;
    }

    async findDniByAppointmentId(appointmentId, conn = pool) {
        const rows = await conn.query(`
            SELECT p.dni FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.id = ?
        `, [appointmentId]);
        return rows[0] || null;
    }

    async updateAfipSettings(doctorId, updates, conn = pool) {
        const validUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (VALID_DOCTOR_COLUMNS.has(key)) {
                validUpdates[key] = value;
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return; // Nothing to update
        }

        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), doctorId];
        return await conn.query(`UPDATE doctors SET ${fields} WHERE id = ?`, values);
    }
}

module.exports = new DoctorRepository();
