const { pool } = require('../../db');
const { nowLocalSQL } = require('../../utils/dateUtils');

/**
 * Finance Stats Service
 * 
 * Centralizes the complex calculation logic for financial reports.
 * Adheres to the MVC separation (Controller -> Service -> DB).
 */

exports.getDetailedStats = async (doctor_id) => {
    let conn;
    try {
        conn = await pool.getConnection();

        const { nowLocalSQL } = require('../../utils/dateUtils');
        const nowString = nowLocalSQL(); // "YYYY-MM-DD HH:mm:ss"
        const todayStr = nowString.split(' ')[0];
        const monthStr = todayStr.slice(0, 7) + '-01';
        const yearStr = todayStr.slice(0, 4) + '-01-01';

        console.log(`🔍 StatsService: today=${todayStr}, month=${monthStr}, year=${yearStr}`);

        // SQL Filter for specific doctor
        const doctorFilter = doctor_id ? " AND doctor_id = ?" : "";
        const statsParams = doctor_id
            ? [todayStr, todayStr, todayStr, todayStr, monthStr, monthStr, monthStr, monthStr, doctor_id]
            : [todayStr, todayStr, todayStr, todayStr, monthStr, monthStr, monthStr, monthStr];

        // 1. Optimized Main Stats Query (Cash/Transfer/Withdrawals)
        const statsQuery = `
            SELECT
                SUM(CASE WHEN t.status = 'paid' AND DATE(t.transaction_date) = ? AND t.is_withdrawal = 0 AND t.method = 'cash' THEN t.amount ELSE 0 END) as todayCash,
                SUM(CASE WHEN t.status = 'paid' AND DATE(t.transaction_date) = ? AND t.is_withdrawal = 0 AND t.method = 'transfer' THEN t.amount ELSE 0 END) as todayTransfer,
                SUM(CASE WHEN t.status = 'paid' AND DATE(t.transaction_date) = ? AND t.is_withdrawal = 1 AND t.method = 'cash' THEN t.amount ELSE 0 END) as todayWithdrawalCash,
                SUM(CASE WHEN t.status = 'paid' AND DATE(t.transaction_date) = ? AND t.is_withdrawal = 1 AND t.method = 'transfer' THEN t.amount ELSE 0 END) as todayWithdrawalTransfer,
                SUM(CASE WHEN t.status = 'paid' AND t.transaction_date >= ? AND t.is_withdrawal = 0 AND t.method = 'cash' THEN t.amount ELSE 0 END) as monthCash,
                SUM(CASE WHEN t.status = 'paid' AND t.transaction_date >= ? AND t.is_withdrawal = 0 AND t.method = 'transfer' THEN t.amount ELSE 0 END) as monthTransfer,
                SUM(CASE WHEN t.is_withdrawal = 1 AND t.transaction_date >= ? AND t.method = 'cash' THEN t.amount ELSE 0 END) as monthCashWithdrawal,
                SUM(CASE WHEN t.is_withdrawal = 1 AND t.transaction_date >= ? AND t.method = 'transfer' THEN t.amount ELSE 0 END) as monthTransferWithdrawal
            FROM transactions t
            WHERE 1=1 ${doctorFilter}
        `;
        const statsRows = await conn.query(statsQuery, statsParams);
        const statsRow = statsRows[0] || {};

        // 2. Year Stats Query
        const yearQuery = `
            SELECT 
                SUM(CASE WHEN method = 'cash' AND is_withdrawal = 0 THEN amount ELSE 0 END) as yearCash,
                SUM(CASE WHEN method = 'transfer' AND is_withdrawal = 0 THEN amount ELSE 0 END) as yearTransfer,
                SUM(CASE WHEN is_withdrawal = 1 AND method = 'cash' THEN amount ELSE 0 END) as yearWithdrawalCash,
                SUM(CASE WHEN is_withdrawal = 1 AND method = 'transfer' THEN amount ELSE 0 END) as yearWithdrawalTransfer
            FROM transactions 
            WHERE status = 'paid' AND transaction_date >= ?
            ${doctorFilter}
        `;
        const yearRows = await conn.query(yearQuery, doctor_id ? [yearStr, doctor_id] : [yearStr]);
        const yearRow = yearRows[0] || {};

        // 3. Helper for Requests (Prescriptions, Licenses, Certificates)
        const getRequestBreakdown = async (type) => {
            const params = doctor_id ? [type, todayStr, doctor_id] : [type, todayStr];
            const monthParams = doctor_id ? [type, monthStr, doctor_id] : [type, monthStr];
            const yearParams = doctor_id ? [type, yearStr, doctor_id] : [type, yearStr];

            const q = (dateClause) => `
                SELECT 
                    COUNT(DISTINCT r.id) as count,
                    SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as paid,
                    SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END) as debt
                FROM medical_requests r
                LEFT JOIN transactions t ON t.request_id = r.id
                WHERE r.type = ? AND ${dateClause}
                AND r.status != 'rejected'
                ${doctor_id ? " AND r.doctor_id = ?" : ""}
            `;

            // Execute queries and unwrap the first row (since these are aggregations)
            const todayRows = await conn.query(q("DATE(r.created_at) = ?"), params);
            const monthRows = await conn.query(q("r.created_at >= ?"), monthParams);
            const yearRows = await conn.query(q("r.created_at >= ?"), yearParams);

            return {
                today: todayRows[0] || { count: 0, paid: 0, debt: 0 },
                month: monthRows[0] || { count: 0, paid: 0, debt: 0 },
                year: yearRows[0] || { count: 0, paid: 0, debt: 0 }
            };
        };

        // 4. Appointment Results (Explicit grouping to avoid "Institutional Payment" duplicates)
        const getApptBreakdown = async () => {
            const paramsToday = doctor_id ? [todayStr, doctor_id] : [todayStr];
            const paramsMonth = doctor_id ? [monthStr, doctor_id] : [monthStr];
            const paramsYear = doctor_id ? [yearStr, doctor_id] : [yearStr];

            const q = (dateClause) => `
                SELECT 
                    COUNT(DISTINCT a.id) as count,
                    SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as paid
                FROM appointments a
                LEFT JOIN transactions t ON t.appointment_id = a.id
                WHERE ${dateClause}
                AND a.status NOT IN ('cancelled', 'absent', 'reserved')
                ${doctor_id ? " AND a.doctor_id = ?" : ""}
            `;

            const todayRows = await conn.query(q("DATE(a.appointment_date) = ?"), paramsToday);
            const monthRows = await conn.query(q("a.appointment_date >= ?"), paramsMonth);
            const yearRows = await conn.query(q("a.appointment_date >= ?"), paramsYear);

            // Debt for past/finalized appointments
            const debtRows = await conn.query(`
                SELECT SUM(t.amount) as total 
                FROM transactions t
                JOIN appointments a ON t.appointment_id = a.id
                WHERE t.status = 'pending' 
                  AND a.status IN ('completed', 'attended', 'arrived', 'absent')
                  ${doctor_id ? " AND t.doctor_id = ?" : ""}
            `, doctor_id ? [doctor_id] : []);
            const debtRow = debtRows[0];

            return {
                today: todayRows[0] || { count: 0, paid: 0 },
                month: monthRows[0] || { count: 0, paid: 0 },
                year: yearRows[0] || { count: 0, paid: 0 },
                debt: debtRow[0]?.total || 0
            };
        };

        // 5. General Expenses
        const expenseRows = await conn.query(`
            SELECT 
                SUM(CASE WHEN DATE(transaction_date) = ? THEN amount ELSE 0 END) as today,
                SUM(CASE WHEN transaction_date >= ? THEN amount ELSE 0 END) as month,
                SUM(CASE WHEN transaction_date >= ? THEN amount ELSE 0 END) as year
            FROM transactions 
            WHERE type LIKE 'expense%' AND status = 'paid'
            ${doctorFilter}
        `, doctor_id ? [todayStr, monthStr, yearStr, doctor_id] : [todayStr, monthStr, yearStr]);
        const expenseRow = expenseRows[0] || {};

        // Aggregate All Data
        const apptDataRaw = await getApptBreakdown();
        const rxDataRaw = await getRequestBreakdown('prescription');
        const licDataRaw = await getRequestBreakdown('license');
        const certDataRaw = await getRequestBreakdown('certificate');

        const totalDebtRows = await conn.query(`
            SELECT SUM(amount) as total 
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            WHERE t.status = 'pending'
              AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
              ${doctor_id ? " AND t.doctor_id = ?" : ""}
        `, doctor_id ? [doctor_id] : []);
        const totalDebtVal = totalDebtRows[0]?.total || 0;

        const apptData = {
            today: { count: Number(apptDataRaw.today.count || 0), paid: Number(apptDataRaw.today.paid || 0) },
            month: { count: Number(apptDataRaw.month.count || 0), paid: Number(apptDataRaw.month.paid || 0) },
            year: { count: Number(apptDataRaw.year.count || 0), paid: Number(apptDataRaw.year.paid || 0) },
            debt: Number(apptDataRaw.debt || 0)
        };

        const rxData = {
            today: { count: Number(rxDataRaw.today.count || 0), paid: Number(rxDataRaw.today.paid || 0), debt: Number(rxDataRaw.today.debt || 0) },
            month: { count: Number(rxDataRaw.month.count || 0), paid: Number(rxDataRaw.month.paid || 0), debt: Number(rxDataRaw.month.debt || 0) },
            year: { count: Number(rxDataRaw.year.count || 0), paid: Number(rxDataRaw.year.paid || 0), debt: Number(rxDataRaw.year.debt || 0) }
        };

        const licData = {
            today: { count: Number(licDataRaw.today.count || 0), paid: Number(licDataRaw.today.paid || 0), debt: Number(licDataRaw.today.debt || 0) },
            month: { count: Number(licDataRaw.month.count || 0), paid: Number(licDataRaw.month.paid || 0), debt: Number(licDataRaw.month.debt || 0) },
            year: { count: Number(licDataRaw.year.count || 0), paid: Number(licDataRaw.year.paid || 0), debt: Number(licDataRaw.year.debt || 0) }
        };

        const certData = {
            today: { count: Number(certDataRaw.today.count || 0), paid: Number(certDataRaw.today.paid || 0), debt: Number(certDataRaw.today.debt || 0) },
            month: { count: Number(certDataRaw.month.count || 0), paid: Number(certDataRaw.month.paid || 0), debt: Number(certDataRaw.month.debt || 0) },
            year: { count: Number(certDataRaw.year.count || 0), paid: Number(certDataRaw.year.paid || 0), debt: Number(certDataRaw.year.debt || 0) }
        };

        const stats = {
            todayCash: Number(statsRow.todayCash || 0),
            todayTransfer: Number(statsRow.todayTransfer || 0),
            todayWithdrawal: Number(statsRow.todayWithdrawalCash || 0) + Number(statsRow.todayWithdrawalTransfer || 0),
            expenseToday: Number(expenseRow.today || 0),

            monthCash: Number(statsRow.monthCash || 0),
            monthTransfer: Number(statsRow.monthTransfer || 0),
            monthWithdrawal: Number(statsRow.monthCashWithdrawal || 0) + Number(statsRow.monthTransferWithdrawal || 0),
            expenseMonth: Number(expenseRow.month || 0),

            yearCash: Number(yearRow.yearCash || 0),
            yearTransfer: Number(yearRow.yearTransfer || 0),
            yearWithdrawal: Number(yearRow.yearWithdrawalCash || 0) + Number(yearRow.yearWithdrawalTransfer || 0),
            expenseYear: Number(expenseRow.year || 0),

            appointments: apptData,
            prescriptions: rxData,
            licenses: licData,
            certificates: certData,
            totalDebt: Number(totalDebtVal || 0)
        };

        return stats;

    } finally {
        if (conn) conn.release();
    }
};
