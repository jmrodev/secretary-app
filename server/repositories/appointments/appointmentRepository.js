const { buildUpdateQuery } = require('../../utils/core/sqlUtils');

class AppointmentRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async getDailySchedule(doctorId, dateStr, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const rows = await connection.query(`CALL sp_get_daily_schedule(?, ?)`, [doctorId, dateStr]);
            // Procedures return arrays of results, the first element is the rows array
            return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
        } finally {
            if (!conn) connection.release();
        }
    }

    async callSpGetFreeSlots(filters, conn = this.pool) {
        const { doctor_id, start_date, days_to_check = 30, include_out_of_hours = 0 } = filters;
        const results = await conn.query(
            "CALL sp_get_free_slots(?, ?, ?, ?)",
            [doctor_id, start_date, days_to_check, include_out_of_hours]
        );
        return results[0] || [];
    }

    async findById(id, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const rows = await connection.query(`
                SELECT * FROM v_appointment_details WHERE id = ?
            `, [id]);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async findBySlot(doctorId, slotDate, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const rows = await connection.query(
                "SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ?",
                [doctorId, slotDate]
            );
            return rows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async create(data, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query(
                "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, is_out_of_hours, type, status, institution_id, bonified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
                [data.patient_id, data.doctor_id, data.appointment_date, data.reason, data.is_out_of_hours || false, data.type || 'consultation', data.status || 'pending', data.institution_id, data.bonified || false]
            );
            return result.insertId;
        } finally {
            if (!conn) connection.release();
        }
    }

    async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const { setClauses, values: updateValues } = buildUpdateQuery('appointments', updates);
        if (!setClauses) return 0;
        const connection = conn || await this.pool.getConnection();
        try {
            const values = [...updateValues, id];
            const sql = "UPDATE appointments SET " + setClauses + " WHERE id = ?";
            const result = await connection.query(sql, values);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async delete(id, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query("DELETE FROM appointments WHERE id = ?", [id]);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async deleteFromRecentlyFreedSlots(doctorId, slotDate, conn = this.pool) {
        return await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [doctorId, slotDate]);
    }

    async addRecentlyFreedSlot(doctorId, slotDate, conn = this.pool) {
        await this.deleteFromRecentlyFreedSlots(doctorId, slotDate, conn);
        return await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [doctorId, slotDate]);
    }

    async createOverwrittenReservation(data, conn = this.pool) {
        const { doctor_id, slot_date, patient_id, patient_name } = data;
        return await conn.query(
            "INSERT INTO overwritten_reservations (doctor_id, slot_date, patient_id, patient_name) VALUES (?, ?, ?, ?)",
            [doctor_id, slot_date, patient_id, patient_name]
        );
    }

    async searchAppointments(filters, conn = this.pool) {
        const { search = '', doctor_id = null, patient_id = null, status = null, start_date = null, end_date = null, page = 1, limit = 50 } = filters;
        const results = await conn.query(
            "CALL sp_search_appointments(?, ?, ?, ?, ?, ?, ?, ?, @p_total_count)",
            [search, doctor_id, patient_id, status, start_date, end_date, page, limit]
        );
        const resultsCount = await conn.query("SELECT @p_total_count as total");
        return {
            appointments: results[0] || [],
            totalCount: resultsCount[0]?.total || 0
        };
    }

    async getHistory(filters, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            let query = "SELECT * FROM v_appointment_details";
            let params = [];
            let whereClauses = [];

            if (filters.patient_id) {
                whereClauses.push("patient_id = ?");
                params.push(filters.patient_id);
            }
            if (filters.doctor_id) {
                whereClauses.push("doctor_id = ?");
                params.push(filters.doctor_id);
            }
            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                whereClauses.push("(patient_name LIKE ? OR reason LIKE ? OR patient_phone LIKE ?)");
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (whereClauses.length > 0) {
                query += " WHERE " + whereClauses.join(" AND ");
            }

            query += " ORDER BY appointment_date DESC";
            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findMonthlyAppointments(month, year, doctorId, conn = this.pool) {
        let query = "SELECT * FROM v_appointment_details WHERE MONTH(appointment_date) = ? AND YEAR(appointment_date) = ?";
        const params = [month, year];
        if (doctorId) {
            query += " AND doctor_id = ?";
            params.push(doctorId);
        }
        query += " ORDER BY appointment_date ASC";
        return await conn.query(query, params);
    }
    async findByDoctorAndDateForSync(doctorId, date, conn = this.pool) {
        return await conn.query(`
            SELECT * FROM v_appointment_details 
            WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status != 'cancelled'
            ORDER BY appointment_date ASC
        `, [doctorId, date]);
    }

    async findLastByPatientId(patientId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 1",
            [patientId]
        );
        return rows[0] || null;
    }

    async findByGoogleEventId(googleEventId, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id, appointment_date, status, payment_status FROM appointments WHERE google_event_id = ?",
            [googleEventId]
        );
        return rows[0] || null;
    }

    async findAllDetailed(conn = this.pool) {
        return await conn.query(`
            SELECT a.id, a.doctor_id, d.full_name as doctor_name, a.patient_id, a.appointment_date, a.status 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            ORDER BY a.doctor_id
        `);
    }

    async findForAudit(start, end, doctorId, conn = this.pool) {
        let sql = `
            SELECT a.id, a.appointment_date, a.reason, a.status, a.payment_status, a.type, a.google_event_id,
                   p.id as patient_id, p.full_name, p.dni, p.phone, p.email,
                   d.full_name as doctor_name, d.id as doctor_id
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_date >= ? AND a.appointment_date <= ?
        `;
        const params = [start, end];
        if (doctorId) {
            sql += " AND a.doctor_id = ?";
            params.push(doctorId);
        }
        sql += " ORDER BY a.appointment_date ASC";
        return await conn.query(sql, params);
    }

    async findInRange(doctorId, start, end, excludedStatuses = [], conn) {
        const connection = conn || await this.pool.getConnection();
        let query = "SELECT appointment_date, duration, is_out_of_hours, status FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ?";
        let params = [doctorId, start, end];
        
        if (excludedStatuses && excludedStatuses.length > 0) {
            query += " AND status NOT IN (" + excludedStatuses.map(() => "?").join(", ") + ")";
            params.push(...excludedStatuses);
        }
        
        try {
            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findByPatientId(patientId, conn = this.pool) {
        return await conn.query(`
            SELECT a.*, d.full_name as doctor_name, t.method as payment_method 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            LEFT JOIN transactions t ON t.appointment_id = a.id
            WHERE a.patient_id = ? 
            ORDER BY a.appointment_date DESC`, [patientId]);
    }

    async findTomorrowAppointments(conn = this.pool) {
        return await conn.query(`
            SELECT a.*, p.full_name as patient_name, p.phone as patient_phone, d.full_name as doctor_name,
                   d.reminder_template, d.reminder_virtual_template
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE DATE(a.appointment_date) = DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)
              AND a.status = 'pending'
              AND (p.phone IS NOT NULL AND p.phone != '')
        `);
    }

    async callSpBookAppointment(data, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            // Ejecutamos el procedimiento
            await connection.query(
                "CALL sp_book_appointment(?, ?, ?, ?, ?, ?, ?, ?, ?, @p_appointment_id)",
                [
                    data.patient_id, data.doctor_id, data.appointment_date, 
                    data.reason, data.is_out_of_hours ? 1 : 0, data.type, 
                    data.institution_id, data.bonified ? 1 : 0, data.created_by
                ]
            );

            // Obtenemos el ID generado mediante la variable de sesión
            const results = await connection.query("SELECT @p_appointment_id as id");
            return results[0]?.id || null;
        } finally {
            if (!conn) connection.release();
        }
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new AppointmentRepository(defaultPool);
const factory = (customPool) => new AppointmentRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
