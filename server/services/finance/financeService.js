const transactionRepository = require('../../../repositories/finance/transactionRepository');
const patientRepository = require('../../../repositories/user/patientRepository');
const { pool } = require('../../../db');
const { formatLocalSQL, nowLocalSQL } = require('../../../utils/core/dateUtils');
const { calculatePrice } = require('../../../utils/finance/priceCalculator');

/**
 * FinanceService (SQL-First Edition)
 * Minimalistic service layer that delegates business logic to MariaDB Stored Procedures.
 */
class FinanceService {
    async createTransaction(data, userId, conn = null) {
        if (!data.doctor_id) throw new Error("Doctor ID is required");
        const connection = conn || await pool.getConnection();
        try {
            if (!conn) await connection.beginTransaction();
            const finalDate = formatLocalSQL(data.transaction_date) || nowLocalSQL();
            
            // Auto-type logic
            if (!data.type) {
                if (data.appointment_id) data.type = 'income_patient';
                else if (data.request_id) data.type = 'income_request';
                else data.type = 'income';
            }

            const transactionId = await transactionRepository.callSpCreateTransaction({
                ...data,
                related_user_id: data.related_user_id || data.patientUserId || null,
                transaction_date: finalDate
            }, connection);

            if (!conn) await connection.commit();
            return transactionId;
        } catch (err) {
            if (!conn) await connection.rollback();
            throw err;
        } finally {
            if (!conn) connection.release();
        }
    }

    async payDebt(data, _userId) {
        const payAmount = parseFloat(data.amount);
        if (isNaN(payAmount) || payAmount <= 0) throw new Error("Invalid amount");
        await pool.query("CALL proc_pay_patient_debt(?, ?, ?, ?, ?)", [
            data.patientId, payAmount, data.method, data.doctor_id || null, 'PAGO_DEUDA'
        ]);
        return payAmount;
    }

    async payInstitutionDebt(data, _userId) {
        const payAmount = parseFloat(data.amount);
        if (isNaN(payAmount) || payAmount <= 0) throw new Error("Invalid amount");
        await transactionRepository.callSpPayInstitutionDebt({
            institution_id: data.institution_id,
            amount: payAmount,
            method: data.method,
            description_prefix: 'PAGO_INST'
        });
        return payAmount;
    }

    async markAsBonified(id, type, conn) {
        await transactionRepository.callSpMarkAsBonified(id, type, conn);
    }

    async syncAppointmentPaymentStatus(appointmentId) {
        // Now handled by SPs, but kept for legacy calls if any
        await pool.query("CALL sp_sync_appointment_payment_status(?)", [appointmentId]);
    }

    async getTransactions(user, filters) {
        const today = nowLocalSQL().split(' ')[0];
        let patientUserId = filters.patientId ? await patientRepository.findUserIdById(filters.patientId) : null;
        const limit = parseInt(filters.limit) || 50;
        const page = parseInt(filters.page) || 1;
        const offset = (page - 1) * limit;

        const [transactions, totalCount] = await Promise.all([
            transactionRepository.findFiltered({ ...filters, role: user.role, user_id: user.user_id, patient_user_id: patientUserId, today, limit, offset }),
            transactionRepository.countFiltered({ ...filters, role: user.role, user_id: user.user_id, patient_user_id: patientUserId, today })
        ]);
        return { transactions, totalCount };
    }

    async getPricing(doctorId, patientId, serviceType) {
        return await calculatePrice(pool, doctorId, patientId, serviceType);
    }

    async closeCashBox(data) {
        await transactionRepository.create({
            type: 'withdrawal', amount: parseFloat(data.amount_delivered),
            description: data.description, doctor_id: data.doctor_id,
            status: 'paid', is_withdrawal: true, transaction_date: nowLocalSQL()
        });
    }

    async getPendingClosures(doctorId) {
        return await transactionRepository.findPendingClosures(doctorId);
    }
}

module.exports = new FinanceService();
