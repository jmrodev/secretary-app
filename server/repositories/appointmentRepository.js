const { pool } = require('../db');

class AppointmentRepository {
    async findById(id, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const rows = await connection.query(`
                SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating
                FROM appointments a 
                LEFT JOIN patients p ON a.patient_id = p.id 
                WHERE a.id = ?
            `, [id]);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async findBySlot(doctorId, slotDate, conn) {
        const connection = conn || await pool.getConnection();
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
        const connection = conn || await pool.getConnection();
        try {
            const result = await connection.query(
                "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, is_out_of_hours, type, status, institution_id, bonified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [data.patient_id, data.doctor_id, data.appointment_date, data.reason, data.is_out_of_hours || false, data.type || 'consultation', data.status || 'pending', data.institution_id, data.bonified || false]
            );
            return result.insertId;
        } finally {
            if (!conn) connection.release();
        }
    }

    async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const connection = conn || await pool.getConnection();
        try {
            const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), id];
            const result = await connection.query(`UPDATE appointments SET ${setClauses} WHERE id = ?`, values);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async delete(id, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const result = await connection.query("DELETE FROM appointments WHERE id = ?", [id]);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async deleteFromRecentlyFreedSlots(doctorId, slotDate, conn = pool) {
        return await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [doctorId, slotDate]);
    }

    async addRecentlyFreedSlot(doctorId, slotDate, conn = pool) {
        await this.deleteFromRecentlyFreedSlots(doctorId, slotDate, conn);
        return await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [doctorId, slotDate]);
    }

    async createOverwrittenReservation(data, conn = pool) {
        const { doctor_id, slot_date, patient_id, patient_name } = data;
        return await conn.query(
            "INSERT INTO overwritten_reservations (doctor_id, slot_date, patient_id, patient_name) VALUES (?, ?, ?, ?)",
            [doctor_id, slot_date, patient_id, patient_name]
        );
    }

    async getHistory(filters, conn) {
        const connection = conn || await pool.getConnection();
        try {
            let query = `
                SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating, 
                (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t LEFT JOIN appointments a2 ON t.appointment_id = a2.id WHERE t.related_user_id = p.user_id AND t.status = 'pending' AND (t.appointment_id IS NULL OR a2.status IN ('completed', 'attended', 'arrived', 'absent'))) as total_debt,
                (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'paid') as paid_amount,
                (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'pending') as pending_amount,
                (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id) as total_appointments,
                (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id AND (a2.status = 'absent' OR (a2.status = 'cancelled' AND COALESCE(a2.cancellation_reason, '') NOT LIKE '%error%'))) as missed_appointments,
                (SELECT GROUP_CONCAT(DISTINCT t.method) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'paid') as payment_methods,
                (SELECT i.cbte_nro FROM invoices i JOIN transactions t ON i.transaction_id = t.id WHERE t.appointment_id = a.id LIMIT 1) as invoice_number,
                (SELECT i.punto_vta FROM invoices i JOIN transactions t ON i.transaction_id = t.id WHERE t.appointment_id = a.id LIMIT 1) as invoice_punto_vta,
                (SELECT i.cae FROM invoices i JOIN transactions t ON i.transaction_id = t.id WHERE t.appointment_id = a.id LIMIT 1) as invoice_cae,
                (SELECT i.cae_vto FROM invoices i JOIN transactions t ON i.transaction_id = t.id WHERE t.appointment_id = a.id LIMIT 1) as invoice_cae_vto,
                (SELECT i.cbte_tipo FROM invoices i JOIN transactions t ON i.transaction_id = t.id WHERE t.appointment_id = a.id LIMIT 1) as invoice_cbte_tipo,
                d.full_name as doctor_name, d.afip_cuit as doctor_cuit, p.phone as patient_phone 
                FROM appointments a 
                LEFT JOIN patients p ON a.patient_id = p.id 
                JOIN doctors d ON a.doctor_id = d.id
            `;
            let params = [];
            let whereClauses = [];

            if (filters.patient_id) {
                whereClauses.push("a.patient_id = ?");
                params.push(filters.patient_id);
            }
            if (filters.doctor_id) {
                whereClauses.push("a.doctor_id = ?");
                params.push(filters.doctor_id);
            }
            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                whereClauses.push("(p.full_name LIKE ? OR a.reason LIKE ? OR p.phone LIKE ?)");
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (whereClauses.length > 0) {
                query += " WHERE " + whereClauses.join(" AND ");
            }

            query += " ORDER BY a.appointment_date DESC";
            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findMonthlyAppointments(month, year, doctorId, conn = pool) {
        let query = `
            SELECT 
                a.id, a.appointment_date, a.reason, a.status, a.payment_status, a.type, a.is_out_of_hours, a.bonified,
                p.full_name as patient_name, d.full_name as doctor_name,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid') as paid_amount,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid' AND (method = 'cash' OR method = 'efectivo')) as cash_amount,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'pending') as debt_amount,
                (SELECT GROUP_CONCAT(method) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid') as methods
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?
        `;
        const params = [month, year];
        if (doctorId) {
            query += " AND a.doctor_id = ?";
            params.push(doctorId);
        }
        query += " ORDER BY a.appointment_date ASC";
        return await conn.query(query, params);
    }
    async findByDoctorAndDateForSync(doctorId, date, conn = pool) {
        return await conn.query(`
            SELECT a.*, p.full_name as patient_name, p.phone as patient_phone,
                   COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as amount_paid,
                   COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as amount_debt
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN transactions t ON t.appointment_id = a.id
            WHERE a.doctor_id = ? AND DATE(a.appointment_date) = ? AND a.status != 'cancelled'
            GROUP BY a.id ORDER BY a.appointment_date ASC
        `, [doctorId, date]);
    }

    async findLastByPatientId(patientId, conn = pool) {
        const rows = await conn.query(
            "SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 1",
            [patientId]
        );
        return rows[0] || null;
    }

    async findByGoogleEventId(googleEventId, conn = pool) {
        const rows = await conn.query(
            "SELECT id, appointment_date, status, payment_status FROM appointments WHERE google_event_id = ?",
            [googleEventId]
        );
        return rows[0] || null;
    }

    async findAllDetailed(conn = pool) {
        return await conn.query(`
            SELECT a.id, a.doctor_id, d.full_name as doctor_name, a.patient_id, a.appointment_date, a.status 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            ORDER BY a.doctor_id
        `);
    }

    async findForAudit(start, end, doctorId, conn = pool) {
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
        const connection = conn || await pool.getConnection();
        const statusSql = excludedStatuses.length > 0
            ? `AND status NOT IN (${excludedStatuses.map(() => '?').join(', ')})`
            : "";
        const query = `SELECT appointment_date, duration, is_out_of_hours, status 
                       FROM appointments 
                       WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ? ${statusSql}`;
        const params = [doctorId, start, end, ...excludedStatuses];
        try {
            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findByPatientId(patientId, conn = pool) {
        return await conn.query(`
            SELECT a.*, d.full_name as doctor_name 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            WHERE a.patient_id = ? 
            ORDER BY a.appointment_date DESC`, [patientId]);
    }

    async getStats(patientId, conn = pool) {
        return await conn.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status IN ('completed', 'attended', 'arrived') THEN 1 END) as attended,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
            FROM appointments 
            WHERE patient_id = ?`, [patientId]);
    }

    async getAppointmentSummaryStats(dateColumn, dateValue, isExactDate, doctor_id, conn = pool) {
        const doctorFilter = doctor_id ? " AND a.doctor_id = ?" : "";
        const dateFilter = isExactDate ? `DATE(a.${dateColumn}) = ?` : `a.${dateColumn} >= ?`;
        const query = `
            SELECT 
                COUNT(DISTINCT a.id) as count,
                SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as paid,
                SUM(a.bonified) as bonified
            FROM appointments a
            LEFT JOIN transactions t ON t.appointment_id = a.id
            WHERE ${dateFilter}
            AND a.status NOT IN ('cancelled', 'absent', 'reserved')
            ${doctorFilter}
        `;
        const params = [dateValue];
        if (doctor_id) params.push(doctor_id);
        const [row] = await conn.query(query, params);
        return row || { count: 0, paid: 0 };
    }

    async getAppointmentDebt(doctor_id, conn = pool) {
        const query = `
            SELECT SUM(t.amount) as total 
            FROM transactions t
            JOIN appointments a ON t.appointment_id = a.id
            WHERE t.status = 'pending' 
              AND a.status IN ('completed', 'attended', 'arrived', 'absent')
              ${doctor_id ? " AND t.doctor_id = ?" : ""}
        `;
        const [row] = await conn.query(query, doctor_id ? [doctor_id] : []);
        return row?.total || 0;
    }

    async getTotalDebt(doctor_id, conn = pool) {
        const query = `
            SELECT SUM(t.amount) as total 
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            WHERE t.status = 'pending'
              AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
              ${doctor_id ? " AND t.doctor_id = ?" : ""}
        `;
        const [row] = await conn.query(query, doctor_id ? [doctor_id] : []);
        return row?.total || 0;
    }
}

module.exports = new AppointmentRepository();
