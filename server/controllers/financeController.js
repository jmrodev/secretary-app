const { logAction } = require('../utils/audit');
const { formatLocalSQL } = require('../utils/dateUtils');
const statsService = require('../services/finance/statsService');
const financeService = require('../services/finance/financeService');
const transactionRepository = require('../repositories/transactionRepository');

/**
 * financeController
 * Handles HTTP requests for financial operations.
 * All business logic is delegated to financeService.
 */

exports.getPricing = async (req, res) => {
    try {
        const { service_type } = req.query;
        const { doctor_id, patientId } = req.body || {};
        if (!doctor_id) return res.status(400).send("Doctor ID required");
        const result = await financeService.getPricing(doctor_id, patientId, service_type);
        res.json({ price: result.price.toFixed(2), explanation: result.explanation });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) data.proof_file = `/uploads/${req.file.filename}`;
        if (data.payments && typeof data.payments === 'string') {
            try { data.payments = JSON.parse(data.payments); } catch (e) { }
        }
        const insertId = await financeService.createTransaction(data, req.user?.user_id);
        logAction(req, 'FINANCE_CREATE', `Created transaction: ${data.description}`);
        res.status(201).json({ message: "Transaction created successfully", id: insertId });
    } catch (err) {
        if (err.message.includes("Doctor ID is required")) {
            return res.status(400).send(err.message);
        }
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getTransactions = async (req, res) => {
    try {
        let { doctor_id, patientId, page, limit, search } = req.query;
        if (doctor_id === 'all' || !doctor_id) doctor_id = null;
        const result = await financeService.getTransactions(req.user, { doctor_id, patientId, page, limit, search });
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getPendingClosures = async (req, res) => {
    try {
        let { doctor_id } = req.query;
        if (doctor_id === 'all' || !doctor_id) doctor_id = null;
        if (req.user.role === 'doctor') {
            const [doc] = await pool.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);
            doctor_id = doc?.id;
        }
        const closures = await financeService.getPendingClosures(doctor_id);
        res.json(closures);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getStats = async (req, res) => {
    try {
        let { doctor_id } = req.query;
        if (doctor_id === 'all' || !doctor_id) doctor_id = null;
        const stats = await statsService.getDetailedStats(doctor_id);
        const result = [
            { type: 'cash', today: stats.todayCash, month: stats.monthCash, year: stats.yearCash },
            { type: 'transfer', today: stats.todayTransfer, month: stats.monthTransfer, year: stats.yearTransfer },
            { type: 'withdrawal', today: stats.todayWithdrawal, month: stats.monthWithdrawal, year: stats.yearWithdrawal },
            { type: 'expenses', today: stats.expenseToday, month: stats.expenseMonth, year: stats.expenseYear },
            { type: 'appointments', today: stats.appointments.today, month: stats.appointments.month, year: stats.appointments.year, debt: stats.appointments.debt },
            { type: 'prescriptions', today: stats.prescriptions.today, month: stats.prescriptions.month, year: stats.prescriptions.year, debt: stats.prescriptions.month?.debt },
            { type: 'licenses', today: stats.licenses.today, month: stats.licenses.month, year: stats.licenses.year, debt: stats.licenses.month?.debt },
            { type: 'certificates', today: stats.certificates.today, month: stats.certificates.month, year: stats.certificates.year, debt: stats.certificates.month?.debt },
            { type: 'pending_debt', total: stats.totalDebt },
            {
                type: 'cash_balance',
                today: stats.todayCash - Number(stats.todayWithdrawalCash || 0) - (stats.expenseTodayCash || 0),
                month: stats.monthCash - Number(stats.monthCashWithdrawal || 0) - (stats.expenseMonthCash || 0),
                year: stats.yearCash - Number(stats.yearWithdrawalCash || 0) - (stats.expenseYearCash || 0)
            },
            {
                type: 'transfer_balance',
                today: stats.todayTransfer - Number(stats.todayWithdrawalTransfer || 0) - (stats.expenseTodayTransfer || 0),
                month: stats.monthTransfer - Number(stats.monthTransferWithdrawal || 0) - (stats.expenseMonthTransfer || 0),
                year: stats.yearTransfer - Number(stats.yearWithdrawalTransfer || 0) - (stats.expenseYearTransfer || 0)
            },
            {
                type: 'total_net',
                today: (stats.todayCash + stats.todayTransfer) - stats.todayWithdrawal - stats.expenseToday,
                month: (stats.monthCash + stats.monthTransfer) - stats.monthWithdrawal - stats.expenseMonth,
                year: (stats.yearCash + stats.yearTransfer) - stats.yearWithdrawal - stats.expenseYear
            },
        ];
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.closeCashBox = async (req, res) => {
    try {
        await financeService.closeCashBox(req.body);
        logAction(req, 'FINANCE_WITHDRAWAL', `Closed box for Doctor ID ${req.body.doctor_id}: delivered $${req.body.amount_delivered}`);
        res.status(201).send("Cash box closed successfully");
    } catch (err) {
        if (err.message === "Invalid amount") return res.status(400).send(err.message);
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.payDebt = async (req, res) => {
    try {
        const totalPaid = await financeService.payDebt(req.body, req.user?.user_id);
        res.json({ message: "Payment processed", paid: totalPaid });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.payInstitutionDebt = async (req, res) => {
    try {
        const totalPaid = await financeService.payInstitutionDebt(req.body, req.user?.user_id);
        res.json({ message: "Institution payment processed", paid: totalPaid });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, method, status, transaction_date } = req.body;
        const oldTx = await transactionRepository.findById(id);
        if (!oldTx) return res.status(404).send("Transaction not found");

        const finalDate = formatLocalSQL(transaction_date) || formatLocalSQL(oldTx.transaction_date);
        await transactionRepository.update(id, { amount, description, method, status, transaction_date: finalDate });

        if (oldTx.appointment_id) await financeService.syncAppointmentPaymentStatus(oldTx.appointment_id, req.user?.user_id);
        if (oldTx.request_id) await financeService.syncRequestPaymentStatus(oldTx.request_id);
        logAction(req, 'FINANCE_UPDATE', `Updated transaction ${id}`);
        res.json({ message: 'Transaction updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const oldTx = await transactionRepository.findById(id);
        if (!oldTx) return res.status(404).send("Transaction not found");

        await transactionRepository.delete(id);
        if (oldTx.appointment_id) await financeService.syncAppointmentPaymentStatus(oldTx.appointment_id, req.user?.user_id);
        if (oldTx.request_id) await financeService.syncRequestPaymentStatus(oldTx.request_id);

        logAction(req, 'FINANCE_DELETE', `Deleted transaction ${id}`);
        res.json({ message: "Transaction deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getTransactionAudits = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Admin only");
        const { transaction_id, action } = req.query;
        const audits = await transactionRepository.getAudits({ transaction_id, action });
        res.json(audits);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
