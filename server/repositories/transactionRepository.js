const { pool } = require('../db');

const ALLOWED_UPDATES = [
    'type', 'amount', 'description', 'transaction_date',
    'related_user_id', 'doctor_id', 'method', 'status',
    'proof_file', 'is_withdrawal', 'request_id',
    'appointment_id', 'institution_id'
];

class TransactionRepository {
    async findById(id, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const rows = await connection.query("SELECT * FROM transactions WHERE id = ?", [id]);
            return rows[0] || null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async create(data, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const query = `
                INSERT INTO transactions 
                (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date, is_withdrawal) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = await connection.query(query, [
                data.type, data.amount, data.description, data.related_user_id || null,
                data.doctor_id || null, data.institution_id || null, data.method || 'cash',
                data.status || 'paid', data.proof_file || null, data.request_id || null,
                data.appointment_id || null, data.transaction_date, data.is_withdrawal || false
            ]);
            return result.insertId;
        } finally {
            if (!conn) connection.release();
        }
    }

    async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;

        // Filter updates to only allow whitelisted fields
        const validUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_UPDATES.includes(key)) {
                validUpdates[key] = updates[key];
            }
        }

        if (Object.keys(validUpdates).length === 0) return 0;
        const connection = conn || await pool.getConnection();
        try {
            const setClauses = Object.keys(validUpdates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(validUpdates), id];
            const result = await connection.query(`UPDATE transactions SET ${setClauses} WHERE id = ?`, values);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async delete(id, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const result = await connection.query("DELETE FROM transactions WHERE id = ?", [id]);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async deletePendingByAppointment(appointmentId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            await connection.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [appointmentId]);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findPendingByAppointment(appointmentId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            return await connection.query(
                "SELECT * FROM transactions WHERE appointment_id = ? AND status = 'pending'",
                [appointmentId]
            );
        } finally {
            if (!conn) connection.release();
        }
    }

    async deletePendingByRequest(requestId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            await connection.query("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'", [requestId]);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findPendingByRequest(requestId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            return await connection.query(
                "SELECT * FROM transactions WHERE request_id = ? AND status = 'pending'",
                [requestId]
            );
        } finally {
            if (!conn) connection.release();
        }
    }

    async findPendingByUserId(userId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            return await connection.query(
                "SELECT * FROM transactions WHERE related_user_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC",
                [userId]
            );
        } finally {
            if (!conn) connection.release();
        }
    }

    async findPendingByInstitutionId(institutionId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            return await connection.query(
                "SELECT * FROM transactions WHERE institution_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC",
                [institutionId]
            );
        } finally {
            if (!conn) connection.release();
        }
    }

    async getTransactionMethods(appointmentId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const rows = await connection.query(
                "SELECT DISTINCT method FROM transactions WHERE appointment_id = ? AND status = 'paid'",
                [appointmentId]
            );
            return rows.map(r => r.method);
        } finally {
            if (!conn) connection.release();
        }
    }

    async getPaymentSummary(appointmentId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const rows = await connection.query(
                "SELECT amount, status FROM transactions WHERE appointment_id = ?",
                [appointmentId]
            );
            let totalPaid = 0, totalPending = 0;
            let hasPaid = false, hasPending = false;
            rows.forEach(t => {
                if (t.status === 'paid') {
                    totalPaid += Number(t.amount);
                    hasPaid = true;
                } else if (t.status === 'pending') {
                    totalPending += Number(t.amount);
                    hasPending = true;
                }
            });
            return { totalPaid, totalPending, hasPaid, hasPending };
        } finally {
            if (!conn) connection.release();
        }
    }

    async getRequestPaymentSummary(requestId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const rows = await connection.query(
                "SELECT amount, status FROM transactions WHERE request_id = ?",
                [requestId]
            );
            let totalPaid = 0, totalPending = 0;
            let hasPaid = false, hasPending = false;
            rows.forEach(t => {
                if (t.status === 'paid') {
                    totalPaid += Number(t.amount);
                    hasPaid = true;
                } else if (t.status === 'pending') {
                    totalPending += Number(t.amount);
                    hasPending = true;
                }
            });
            return { totalPaid, totalPending, hasPaid, hasPending };
        } finally {
            if (!conn) connection.release();
        }
    }
    async findFiltered(filters, conn) {
        const connection = conn || await pool.getConnection();
        const limit = parseInt(filters.limit) || 50;
        const offset = parseInt(filters.offset) || 0;

        try {
            let query = `SELECT t.*, u.username as related_user_name, d.full_name as doctor_name, p.full_name as patient_full_name, p.dni as patient_dni,
                                i.cbte_nro as invoice_number, r.type as request_type, a.bonified, r.payment_status
                         FROM transactions t 
                         LEFT JOIN users u ON t.related_user_id = u.id
                         LEFT JOIN doctors d ON t.doctor_id = d.id
                         LEFT JOIN patients p ON p.user_id = u.id
                         LEFT JOIN invoices i ON i.transaction_id = t.id
                         LEFT JOIN medical_requests r ON t.request_id = r.id
                         LEFT JOIN appointments a ON t.appointment_id = a.id`;

            let whereClauses = [
                "(t.status != 'pending' OR t.appointment_id IS NULL OR a.status = 'completed' OR (DATE(a.appointment_date) = ? AND a.status NOT IN ('cancelled', 'absent', 'reserved')))"
            ];
            let params = [filters.today || new Date().toISOString().split('T')[0]];

            if (filters.user_id && filters.role) {
                if (filters.role === 'doctor') {
                    const [doc] = await connection.query("SELECT id FROM doctors WHERE user_id = ?", [filters.user_id]);
                    if (doc) {
                        whereClauses.push("(t.doctor_id = ? OR t.related_user_id = ?)");
                        params.push(doc.id, filters.user_id);
                    } else {
                        whereClauses.push("t.related_user_id = ?");
                        params.push(filters.user_id);
                    }
                } else if (filters.role === 'patient') {
                    whereClauses.push("t.related_user_id = ?");
                    params.push(filters.user_id);
                }
            } else {
                if (filters.doctor_id) { whereClauses.push("t.doctor_id = ?"); params.push(filters.doctor_id); }
                if (filters.patient_user_id) { whereClauses.push("t.related_user_id = ?"); params.push(filters.patient_user_id); }
                if (filters.institution_id) { whereClauses.push("t.institution_id = ?"); params.push(filters.institution_id); }
            }

            // Search Filter
            if (filters.search) {
                const search = `%${filters.search}%`;
                whereClauses.push("(p.full_name LIKE ? OR t.description LIKE ? OR t.amount LIKE ?)");
                params.push(search, search, search);
            }

            if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
            query += " ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?";
            params.push(limit, offset);

            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async countFiltered(filters, conn) {
        const connection = conn || await pool.getConnection();
        try {
            let query = `SELECT COUNT(*) as count
                         FROM transactions t 
                         LEFT JOIN users u ON t.related_user_id = u.id
                         LEFT JOIN doctors d ON t.doctor_id = d.id
                         LEFT JOIN patients p ON p.user_id = u.id
                         LEFT JOIN medical_requests r ON t.request_id = r.id
                         LEFT JOIN appointments a ON t.appointment_id = a.id`;

            let whereClauses = [
                "(t.status != 'pending' OR t.appointment_id IS NULL OR a.status = 'completed' OR (DATE(a.appointment_date) = ? AND a.status NOT IN ('cancelled', 'absent', 'reserved')))"
            ];
            let params = [filters.today || new Date().toISOString().split('T')[0]];

            if (filters.user_id && filters.role) {
                if (filters.role === 'doctor') {
                    const [doc] = await connection.query("SELECT id FROM doctors WHERE user_id = ?", [filters.user_id]);
                    if (doc) {
                        whereClauses.push("(t.doctor_id = ? OR t.related_user_id = ?)");
                        params.push(doc.id, filters.user_id);
                    } else {
                        whereClauses.push("t.related_user_id = ?");
                        params.push(filters.user_id);
                    }
                } else if (filters.role === 'patient') {
                    whereClauses.push("t.related_user_id = ?");
                    params.push(filters.user_id);
                }
            } else {
                if (filters.doctor_id) { whereClauses.push("t.doctor_id = ?"); params.push(filters.doctor_id); }
                if (filters.patient_user_id) { whereClauses.push("t.related_user_id = ?"); params.push(filters.patient_user_id); }
                if (filters.institution_id) { whereClauses.push("t.institution_id = ?"); params.push(filters.institution_id); }
            }

            if (filters.search) {
                const search = `%${filters.search}%`;
                whereClauses.push("(p.full_name LIKE ? OR t.description LIKE ? OR t.amount LIKE ?)");
                params.push(search, search, search);
            }

            if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
            const [row] = await connection.query(query, params);
            return Number(row.count);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findFullDetailsById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT t.*, p.full_name as patient_name, a.type as appt_type, r.type as req_type, d.full_name as doctor_name
            FROM transactions t
            LEFT JOIN users u ON t.related_user_id = u.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN medical_requests r ON t.request_id = r.id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            WHERE t.id = ?
        `, [id]);
        return rows[0] || null;
    }

    async updateByRequestId(requestId, updates, conn = pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;

        // Filter updates to only allow whitelisted fields
        const validUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_UPDATES.includes(key)) {
                validUpdates[key] = updates[key];
            }
        }

        if (Object.keys(validUpdates).length === 0) return 0;
        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), requestId];
        return await conn.query(`UPDATE transactions SET ${fields} WHERE request_id = ? AND status = 'pending'`, values);
    }

    async deletePendingByRequestId(requestId, conn = pool) {
        return await conn.query("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'", [requestId]);
    }

    async findMonthlyIncome(month, year, doctorId, conn = pool) {
        let query = `
            SELECT amount, method, transaction_date, type, appointment_id, request_id 
            FROM transactions 
            WHERE is_withdrawal = 0 
              AND status = 'paid' 
              AND MONTH(transaction_date) = ? 
              AND YEAR(transaction_date) = ?
        `;
        const params = [month, year];
        if (doctorId) {
            query += " AND doctor_id = ?";
            params.push(doctorId);
        }
        return await conn.query(query, params);
    }

    async findMonthlyWithdrawals(month, year, doctorId, conn = pool) {
        let query = `
            SELECT amount, transaction_date, description FROM transactions 
            WHERE (type = 'withdrawal' OR type = 'payout') 
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        `;
        const params = [month, year];
        if (doctorId) {
            query += " AND doctor_id = ?";
            params.push(doctorId);
        }
        return await conn.query(query, params);
    }

    async findTotalIncomeByPeriod(month, year, doctorId, conn = pool) {
        let query = `
            SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
            WHERE type = 'income_patient' AND status = 'paid' AND appointment_id IS NOT NULL
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
        `;
        const params = [month, year];
        if (doctorId) {
            query += " AND doctor_id = ?";
            params.push(doctorId);
        }
        const rows = await conn.query(query, params);
        return rows[0]?.total || 0;
    }

    async findPendingClosures(doctorId, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const doctorClause = doctorId ? "AND t.doctor_id = ?" : "";
            const params = [];
            if (doctorId) params.push(doctorId);

            const query = `
                SELECT 
                    DATE(t.transaction_date) as date,
                    MAX(TIME(t.transaction_date)) as lastTime,
                    t.doctor_id,
                    d.full_name as doctor_name,
                    SUM(CASE WHEN t.method = 'cash' THEN 
                        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
                             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
                             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
                             ELSE 0 END 
                        ELSE 0 END) as balance,
                    SUM(CASE WHEN t.method != 'cash' THEN 
                        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
                             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
                             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
                             ELSE 0 END 
                        ELSE 0 END) as transferBalance
                FROM transactions t
                LEFT JOIN doctors d ON t.doctor_id = d.id
                WHERE t.status = 'paid' ${doctorClause}
                GROUP BY DATE(t.transaction_date), t.doctor_id
                HAVING balance > 0.01 OR transferBalance > 0.01
                ORDER BY date DESC
            `;

            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }
}

module.exports = new TransactionRepository();
