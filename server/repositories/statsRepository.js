const { pool } = require('../db');

/**
 * StatsRepository
 * Handles aggregate queries for system statistics.
 */
class StatsRepository {
    async countAppointments(filters = {}, conn = pool) {
        const { doctorId, from, to } = filters;
        let query = "SELECT COUNT(*) as count FROM appointments WHERE 1=1";
        const params = [];

        if (doctorId) { query += " AND doctor_id = ?"; params.push(doctorId); }
        if (from) { query += " AND appointment_date >= ?"; params.push(from); }
        if (to) { query += " AND appointment_date < ?"; params.push(to); }

        const [row] = await conn.query(query, params);
        return Number(row.count);
    }

    async countPatients(doctorId = null, conn = pool) {
        if (doctorId) {
            const [row] = await conn.query("SELECT COUNT(DISTINCT patient_id) as count FROM patient_doctors WHERE doctor_id = ?", [doctorId]);
            return Number(row.count);
        }
        const [row] = await conn.query("SELECT COUNT(*) as count FROM patients");
        return Number(row.count);
    }

    async getAggregatedFinancialStats(today, month, year, doctorId, conn = pool) {
        const doctorFilter = doctorId ? " AND doctor_id = ?" : "";
        const query = `
            SELECT
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method = 'cash' THEN amount ELSE 0 END) as todayCash,
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method != 'cash' THEN amount ELSE 0 END) as todayTransfer,
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND is_withdrawal = 1 AND method = 'cash' THEN amount ELSE 0 END) as todayWithdrawalCash,
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND is_withdrawal = 1 AND method != 'cash' THEN amount ELSE 0 END) as todayWithdrawalTransfer,
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND type LIKE 'expense%' AND method = 'cash' THEN amount ELSE 0 END) as todayExpenseCash,
                SUM(CASE WHEN status = 'paid' AND DATE(transaction_date) = ? AND type LIKE 'expense%' AND method != 'cash' THEN amount ELSE 0 END) as todayExpenseTransfer,
                
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method = 'cash' THEN amount ELSE 0 END) as monthCash,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method != 'cash' THEN amount ELSE 0 END) as monthTransfer,
                SUM(CASE WHEN is_withdrawal = 1 AND transaction_date >= ? AND method = 'cash' THEN amount ELSE 0 END) as monthCashWithdrawal,
                SUM(CASE WHEN is_withdrawal = 1 AND transaction_date >= ? AND method != 'cash' THEN amount ELSE 0 END) as monthTransferWithdrawal,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND type LIKE 'expense%' AND method = 'cash' THEN amount ELSE 0 END) as monthExpenseCash,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND type LIKE 'expense%' AND method != 'cash' THEN amount ELSE 0 END) as monthExpenseTransfer,
                
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method = 'cash' THEN amount ELSE 0 END) as yearCash,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND is_withdrawal = 0 AND type LIKE 'income%' AND method != 'cash' THEN amount ELSE 0 END) as yearTransfer,
                SUM(CASE WHEN is_withdrawal = 1 AND transaction_date >= ? AND method = 'cash' THEN amount ELSE 0 END) as yearWithdrawalCash,
                SUM(CASE WHEN is_withdrawal = 1 AND transaction_date >= ? AND method != 'cash' THEN amount ELSE 0 END) as yearWithdrawalTransfer,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND type LIKE 'expense%' AND method = 'cash' THEN amount ELSE 0 END) as yearExpenseCash,
                SUM(CASE WHEN status = 'paid' AND transaction_date >= ? AND type LIKE 'expense%' AND method != 'cash' THEN amount ELSE 0 END) as yearExpenseTransfer
            FROM transactions
            WHERE 1=1 ${doctorFilter}
        `;
        const params = [
            today, today, today, today, today, today,
            month, month, month, month, month, month,
            year, year, year, year, year, year
        ];
        if (doctorId) params.push(doctorId);

        const [row] = await conn.query(query, params);
        return row || {};
    }

    async getExpenseAggregates(today, month, year, doctorId, conn = pool) {
        const doctorFilter = doctorId ? " AND doctor_id = ?" : "";
        const query = `
            SELECT 
                SUM(CASE WHEN DATE(transaction_date) = ? THEN amount ELSE 0 END) as today,
                SUM(CASE WHEN transaction_date >= ? THEN amount ELSE 0 END) as month,
                SUM(CASE WHEN transaction_date >= ? THEN amount ELSE 0 END) as year
            FROM transactions 
            WHERE type LIKE 'expense%' AND status = 'paid'
            ${doctorFilter}
        `;
        const params = [today, month, year];
        if (doctorId) params.push(doctorId);

        const [row] = await conn.query(query, params);
        return row || { today: 0, month: 0, year: 0 };
    }
}

module.exports = new StatsRepository();
