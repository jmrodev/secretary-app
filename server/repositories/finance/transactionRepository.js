const ALLOWED_UPDATES = [
    'type', 'amount', 'description', 'transaction_date',
    'related_user_id', 'doctor_id', 'method', 'status',
    'proof_file', 'is_withdrawal', 'request_id',
    'appointment_id', 'institution_id'
];

class TransactionRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findById(id, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const rows = await connection.query("SELECT * FROM transactions WHERE id = ?", [id]);
            return rows[0] || null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async callSpCreateTransaction(data, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const query = "CALL sp_create_transaction(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_id)";
            await connection.query(query, [
                data.type,
                data.amount,
                data.method || 'cash',
                data.description,
                data.doctor_id || null,
                data.status || 'paid',
                data.is_withdrawal || false,
                data.related_user_id || null,
                data.transaction_date || null,
                data.appointment_id || null,
                data.request_id || null,
                data.rental_id || null,
                data.idempotency_key || null
            ]);
            const results = await connection.query("SELECT @p_id as id");
            return results[0]?.id || null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async callSpMarkAsBonified(id, type, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            await connection.query("CALL sp_mark_as_bonified(?, ?)", [id, type]);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findDailySummary(month, year, doctorId, conn) {
        const activeConn = conn || this.pool;
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = `${year}-${String(month).padStart(2, '0')}-31`;
        const query = `SELECT * FROM view_daily_balances WHERE transaction_date BETWEEN ? AND ? ${doctorId ? 'AND doctor_id = ?' : ''}`;
        const params = [start, end];
        if (doctorId) params.push(doctorId);
        return await activeConn.query(query, params);
    }

    async findMonthlyWithdrawals(month, year, doctorId, conn) {
        const activeConn = conn || this.pool;
        const query = `SELECT * FROM transactions WHERE is_withdrawal = 1 AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? ${doctorId ? 'AND doctor_id = ?' : ''}`;
        const params = [month, year];
        if (doctorId) params.push(doctorId);
        return await activeConn.query(query, params);
    }

    async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const validUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_UPDATES.includes(key)) {
                if (key === 'transaction_date' && updates[key]) {
                    const { formatLocalSQL } = require('../../utils/core/dateUtils');
                    validUpdates[key] = formatLocalSQL(updates[key]);
                } else {
                    validUpdates[key] = updates[key];
                }
            }
        }
        if (Object.keys(validUpdates).length === 0) return 0;
        const connection = conn || await this.pool.getConnection();
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
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query("DELETE FROM transactions WHERE id = ?", [id]);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async findByAppointmentId(appointmentId, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            return await connection.query("SELECT * FROM transactions WHERE appointment_id = ?", [appointmentId]);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findByRequestId(requestId, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            return await connection.query("SELECT * FROM transactions WHERE request_id = ?", [requestId]);
        } finally {
            if (!conn) connection.release();
        }
    }

    /**
     * Detaches transactions from their source rows and prefixes the retention label.
     * Idempotent: rows already prefixed with the label are skipped (NOT LIKE guard),
     * so re-running never double-prefixes the description.
     */
    async detachAndLabel(ids, label, conn) {
        if (!ids || ids.length === 0) return 0;
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query(`
                UPDATE transactions
                SET appointment_id = NULL, request_id = NULL,
                    description = CONCAT(?, ': ', COALESCE(description, ''))
                WHERE id IN (?)
                  AND (description IS NULL OR description NOT LIKE CONCAT(?, ':%'))
            `, [label, ids, label]);
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async deletePendingByAppointmentId(appointmentId, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query(
                "DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'",
                [appointmentId]
            );
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async deletePendingByRequestId(requestId, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const result = await connection.query(
                "DELETE FROM transactions WHERE request_id = ? AND status = 'pending'",
                [requestId]
            );
            return result.affectedRows;
        } finally {
            if (!conn) connection.release();
        }
    }

    async findFiltered(filters, conn) {
        const connection = conn || await this.pool.getConnection();
        const limit = parseInt(filters.limit) || 50;
        const offset = parseInt(filters.offset) || 0;
        try {
            let query = `SELECT t.*, u.username as related_user_name, d.full_name as doctor_name, p.full_name as patient_full_name, p.dni as patient_dni,
                                i.cbte_nro as invoice_number, r.type as request_type, a.type as service_type, a.bonified, r.payment_status
                         FROM transactions t 
                         LEFT JOIN users u ON t.related_user_id = u.id
                         LEFT JOIN doctors d ON t.doctor_id = d.id
                         LEFT JOIN patients p ON p.user_id = u.id
                         LEFT JOIN invoices i ON i.transaction_id = t.id
                         LEFT JOIN medical_requests r ON t.request_id = r.id
                         LEFT JOIN appointments a ON t.appointment_id = a.id`;
            let whereClauses = ["(t.status != 'pending' OR t.appointment_id IS NULL OR a.status = 'completed')"];
            let params = [];
            if (filters.doctor_id) { whereClauses.push("t.doctor_id = ?"); params.push(filters.doctor_id); }
            if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
            query += " ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?";
            params.push(limit, offset);
            return await connection.query(query, params);
        } finally {
            if (!conn) connection.release();
        }
    }

    async countFiltered(filters, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            let query = `SELECT COUNT(*) as count FROM transactions t `;
            let whereClauses = ["1=1"];
            let params = [];
            if (filters.doctor_id) { whereClauses.push("t.doctor_id = ?"); params.push(filters.doctor_id); }
            if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
            const [row] = await connection.query(query, params);
            return Number(row.count);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findPendingClosures(doctorId, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const doctorClause = doctorId ? "WHERE doctor_id = ?" : "";
            const query = `SELECT transaction_date as date, doctor_id, doctor_name, cash_balance as balance, transfer_balance as transferBalance
                            FROM view_daily_balances ${doctorClause} ORDER BY date DESC`;
            return await connection.query(query, doctorId ? [doctorId] : []);
        } finally {
            if (!conn) connection.release();
        }
    }

    async findFullDetailsById(id, conn) {
        const connection = conn || await this.pool.getConnection();
        try {
            const query = `
                SELECT t.*, u.username as related_user_name, d.full_name as doctor_name, 
                       p.full_name as patient_name, p.dni as patient_dni,
                       a.appointment_date, a.type as service_type, a.cost, a.created_at,
                       a.confirmed_at, a.arrived_at, a.completed_at, a.paid_at,
                       a.payment_status as appt_payment_status,
                       tx_summary.paid_amount, tx_summary.pending_amount
                FROM transactions t
                LEFT JOIN users u ON t.related_user_id = u.id
                LEFT JOIN patients p ON u.id = p.user_id
                LEFT JOIN doctors d ON t.doctor_id = d.id
                LEFT JOIN appointments a ON t.appointment_id = a.id
                LEFT JOIN (
                    SELECT appointment_id,
                           SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
                           SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
                    FROM transactions
                    WHERE appointment_id IS NOT NULL
                    GROUP BY appointment_id
                ) tx_summary ON t.appointment_id = tx_summary.appointment_id
                WHERE t.id = ?
            `;
            const rows = await connection.query(query, [id]);
            return rows[0] || null;
        } finally {
            if (!conn) connection.release();
        }
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new TransactionRepository(defaultPool);
const factory = (customPool) => new TransactionRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
