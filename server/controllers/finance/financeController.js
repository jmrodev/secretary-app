const { logAction } = require('../../utils/system/audit');
const { formatLocalSQL } = require('../../utils/core/dateUtils');
const statsService = require('../../services/finance/statsService');
const financeService = require('../../services/finance/financeService');
const { pool } = require('../../db');

/**
 * ECC-Pattern: financeController
 */
class FinanceController {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    sendResponse(res, success, data, error = null, status = 200) {
        res.status(status).json({ success, data, error });
    }

    getPricing = async (req, res) => {
        try {
            const { doctor_id, patientId, service_type } = { ...req.query, ...req.body };
            if (!doctor_id) return this.sendResponse(res, false, null, "Doctor ID required", 400);
            const result = await financeService.getPricing(doctor_id, patientId, service_type);
            this.sendResponse(res, true, { price: result.price.toFixed(2), explanation: result.explanation });
        } catch (err) {
            console.error("[ECC-Finance] getPricing error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    getPatientCredit = async (req, res) => {
        try {
            const { patientId } = req.params;
            if (!patientId) return this.sendResponse(res, false, null, "Patient ID required", 400);
            const result = await financeService.getPatientAvailableCredit(patientId);
            this.sendResponse(res, true, result);
        } catch (err) {
            console.error("[ECC-Finance] getPatientCredit error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    createTransaction = async (req, res) => {
        try {
            const data = { ...req.body };
            const result = await financeService.createTransaction(data, req.user?.user_id);
            logAction(req, 'FINANCE_CREATE', `Created transaction: ${data.description}`);
            this.sendResponse(res, true, result, null, 201);
        } catch (err) {
            console.error("[ECC-Finance] createTransaction error:", err);
            this.sendResponse(res, false, null, err.message, 400);
        }
    };

    getTransactions = async (req, res) => {
        try {
            const result = await financeService.getTransactions(req.user, req.query);
            this.sendResponse(res, true, result);
        } catch (err) {
            console.error("[ECC-Finance] getTransactions error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    getPendingClosures = async (req, res) => {
        try {
            let { doctor_id } = req.query;
            if (req.user.role === 'doctor') {
                const [doc] = await pool.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.user_id]);
                doctor_id = doc?.id;
            }
            const closures = await financeService.getPendingClosures(doctor_id);
            this.sendResponse(res, true, closures);
        } catch (err) {
            console.error("[ECC-Finance] getPendingClosures error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    performBalancing = async (req, res) => {
        try {
            const result = await financeService.performBalancing(req.body, req.user?.user_id);
            logAction(req, 'FINANCE_BALANCING', `Performed cash box balancing for doctor ${req.body.doctor_id} on ${req.body.balancing_date}. Diff: ${result.difference}`);
            this.sendResponse(res, true, result);
        } catch (err) {
            console.error("[ECC-Finance] performBalancing error:", err);
            this.sendResponse(res, false, null, err.message, 500);
        }
    };

    getStats = async (req, res) => {
        try {
            const stats = await statsService.getDetailedStats(req.query.doctor_id);
            this.sendResponse(res, true, stats);
        } catch (err) {
            console.error("[ECC-Finance] getStats error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    closeCashBox = async (req, res) => {
        try {
            // Legacy close box kept for compatibility
            await financeService.createTransaction({
                type: 'withdrawal', amount: parseFloat(req.body.amount_delivered),
                description: req.body.description, doctor_id: req.body.doctor_id,
                status: 'paid', is_withdrawal: true, transaction_date: formatLocalSQL(new Date())
            }, req.user.user_id);
            this.sendResponse(res, true, { message: "Cash box closed successfully" });
        } catch (err) {
            console.error("[ECC-Finance] closeCashBox error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    updateTransaction = async (req, res) => {
        try {
            const { id } = req.params;
            const updates = { ...req.body };
            await this.transactionRepository.update(id, updates);
            logAction(req, 'FINANCE_UPDATE', `Updated transaction ${id}`);
            this.sendResponse(res, true, { message: 'Transaction updated successfully' });
        } catch (err) {
            console.error("[ECC-Finance] updateTransaction error:", err);
            this.sendResponse(res, false, null, err.message || "Server Error", 500);
        }
    };

    deleteTransaction = async (req, res) => {
        try {
            const { id } = req.params;
            await this.transactionRepository.delete(id);
            logAction(req, 'FINANCE_DELETE', `Deleted transaction ${id}`);
            this.sendResponse(res, true, { message: "Transaction deleted" });
        } catch (err) {
            console.error("[ECC-Finance] deleteTransaction error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    getTransactionAudits = async (req, res) => {
        try {
            const audits = await this.transactionRepository.getAudits(req.query);
            this.sendResponse(res, true, audits);
        } catch (err) {
            console.error("[ECC-Finance] getTransactionAudits error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    payDebt = async (req, res) => {
        try {
            const result = await financeService.payDebt(req.body, req.user?.user_id);
            this.sendResponse(res, true, result);
        } catch (err) {
            console.error("[ECC-Finance] payDebt error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };

    payInstitutionDebt = async (req, res) => {
        try {
            // Implementation kept for legacy
            this.sendResponse(res, true, { message: "Feature temporarily disabled for ECC refactor" });
        } catch (err) {
            console.error("[ECC-Finance] payInstitutionDebt error:", err);
            this.sendResponse(res, false, null, "Server Error", 500);
        }
    };
}

module.exports = FinanceController;
