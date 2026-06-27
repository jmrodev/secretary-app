

/**
 * StatsRepository
 * Handles aggregate queries for system statistics.
 */
class StatsRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async countAppointments(filters = {}, conn = this.pool) {
        const { doctorId, from, to } = filters;
        let query = "SELECT COUNT(*) as count FROM appointments WHERE 1=1";
        const params = [];

        if (doctorId) { query += " AND doctor_id = ?"; params.push(doctorId); }
        if (from) { query += " AND appointment_date >= ?"; params.push(from); }
        if (to) { query += " AND appointment_date < ?"; params.push(to); }

        const [row] = await conn.query(query, params);
        return Number(row.count);
    }

    async countPatients(doctorId = null, conn = this.pool) {
        if (doctorId) {
            const [row] = await conn.query("SELECT COUNT(DISTINCT patient_id) as count FROM patient_doctors WHERE doctor_id = ?", [doctorId]);
            return Number(row.count);
        }
        const [row] = await conn.query("SELECT COUNT(*) as count FROM patients");
        return Number(row.count);
    }

    async getAggregatedFinancialStats(today, month, year, doctorId, conn = this.pool) {
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

    async getExpenseAggregates(today, month, year, doctorId, conn = this.pool) {
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

    async getAppointmentSummaryStats(dateColumn, dateValue, isExactDate, doctor_id, conn = this.pool) {
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

    async getAppointmentDebt(doctor_id, conn = this.pool) {
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

    async getTotalDebt(doctor_id, conn = this.pool) {
        const query = `
            SELECT SUM(t.amount) as total 
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            WHERE t.status = 'pending'
              AND t.type != 'income_rental'
              AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
              ${doctor_id ? " AND t.doctor_id = ?" : ""}
        `;
        const [row] = await conn.query(query, doctor_id ? [doctor_id] : []);
        return row?.total || 0;
    }

    async getDoctorRentalDebt(doctor_id, conn = this.pool) {
        const query = `
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE status = 'pending' AND type = 'income_rental'
              ${doctor_id ? " AND doctor_id = ?" : ""}
        `;
        const [row] = await conn.query(query, doctor_id ? [doctor_id] : []);
        return row?.total || 0;
    }

    async getNewPatientStats(conn = this.pool) {
        const [stats] = await conn.query(`
            SELECT COUNT(*) as total_new,
                   COUNT(CASE WHEN DATE(u.created_at) = CURDATE() THEN 1 END) as currentDay,
                   COUNT(CASE WHEN YEARWEEK(u.created_at, 1) = YEARWEEK(NOW(), 1) THEN 1 END) as currentWeek,
                   COUNT(CASE WHEN MONTH(u.created_at) = MONTH(NOW()) AND YEAR(u.created_at) = YEAR(NOW()) THEN 1 END) as currentMonth,
                   COUNT(CASE WHEN YEAR(u.created_at) = YEAR(NOW()) THEN 1 END) as currentYear,
                   COUNT(CASE WHEN YEAR(u.created_at) = YEAR(NOW()) - 1 THEN 1 END) as lastYear
            FROM patients p JOIN users u ON p.user_id = u.id WHERE p.is_new_patient = 1
        `);
        return stats[0] || { currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0 };
    }

    async getAllTypesRequestAggregates(types, dateColumn, dateValue, isExactDate, doctor_id, conn = this.pool) {
        if (!types || types.length === 0) return [];
        const doctorFilter = doctor_id ? " AND r.doctor_id = ?" : "";
        const dateFilter = isExactDate ? `DATE(r.${dateColumn}) = ?` : `r.${dateColumn} >= ?`;
        const typePlaceholders = types.map(() => '?').join(',');

        const query = `
            SELECT
                r.type,
                COUNT(DISTINCT r.id) as count,
                SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as paid,
                SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END) as debt,
                SUM(CASE WHEN r.payment_status = 'bonified' THEN 1 ELSE 0 END) as bonified
            FROM medical_requests r
            LEFT JOIN transactions t ON t.request_id = r.id
            WHERE r.type IN (${typePlaceholders}) AND ${dateFilter}
            AND r.status != 'rejected'
            ${doctorFilter}
            GROUP BY r.type
        `;
        const params = [...types, dateValue];
        if (doctor_id) params.push(doctor_id);

        const rows = await conn.query(query, params);
        return rows;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new StatsRepository(defaultPool);
const factory = (customPool) => new StatsRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
