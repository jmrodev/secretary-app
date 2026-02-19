const transactionRepository = require('../../repositories/transactionRepository');
const appointmentRepository = require('../../repositories/appointmentRepository');
const patientRepository = require('../../repositories/patientRepository');
const medicalRequestRepository = require('../../repositories/medicalRequestRepository');
const { pool } = require('../../db');
const { formatLocalSQL, nowLocalSQL } = require('../../utils/dateUtils');
const { calculatePrice } = require('../../utils/priceCalculator');

class FinanceService {
    async createTransaction(data, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const finalDate = formatLocalSQL(data.transaction_date) || nowLocalSQL();

            // 1. Cleanup pending
            if (data.appointment_id) {
                await transactionRepository.deletePendingByAppointment(data.appointment_id, conn);
            }
            if (data.request_id) {
                await transactionRepository.deletePendingByRequest(data.request_id, conn);
            }

            let lastInsertId;

            // 2. Register Payments
            if (Array.isArray(data.payments) && data.payments.length > 0) {
                for (const p of data.payments) {
                    if (Number(p.amount) > 0) {
                        const methodSuffix = data.payments.length > 1 ? ` [${(p.method || 'cash').toUpperCase()}]` : '';
                        lastInsertId = await transactionRepository.create({
                            ...data,
                            amount: p.amount,
                            description: `${data.description}${methodSuffix}`,
                            method: p.method || 'cash',
                            status: data.status || 'paid',
                            transaction_date: finalDate
                        }, conn);
                    }
                }
            } else if (Number(data.amount) > 0) {
                lastInsertId = await transactionRepository.create({
                    ...data,
                    transaction_date: finalDate
                }, conn);
            }

            // 3. Register Debt
            if (Number(data.debt_amount) > 0) {
                await transactionRepository.create({
                    ...data,
                    amount: data.debt_amount,
                    description: `DEBT: ${data.description}`,
                    method: 'on_account',
                    status: 'pending',
                    transaction_date: finalDate
                }, conn);
            }

            // 4. Sync
            if (data.appointment_id) await this.syncAppointmentPaymentStatus(data.appointment_id, userId, conn);
            if (data.request_id) await this.syncRequestPaymentStatus(data.request_id, conn);

            await conn.commit();
            return lastInsertId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async payDebt(data, currentUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const { patient_id, amount, method, doctor_id } = data;
            const payAmount = parseFloat(amount);

            const userId = await patientRepository.findUserIdById(patient_id, conn);
            if (!userId) throw new Error("Patient not found");

            const debts = await transactionRepository.findPendingByUserId(userId, conn);
            let remaining = payAmount;
            let totalPaid = 0;

            for (const debt of debts) {
                if (remaining <= 0.01) break;
                const debtAmount = Number(debt.amount);

                if (remaining >= debtAmount) {
                    await transactionRepository.update(debt.id, {
                        status: 'paid',
                        method: method,
                        description: `${debt.description} - Paid`
                    }, conn);
                    if (debt.appointment_id) await this.syncAppointmentPaymentStatus(debt.appointment_id, currentUserId, conn);
                    if (debt.request_id) await this.syncRequestPaymentStatus(debt.request_id, conn);
                    remaining -= debtAmount;
                    totalPaid += debtAmount;
                } else {
                    await transactionRepository.update(debt.id, {
                        status: 'paid',
                        amount: remaining,
                        method: method,
                        description: `${debt.description} - Paid Part`
                    }, conn);

                    const remainder = debtAmount - remaining;
                    await transactionRepository.create({
                        ...debt,
                        amount: remainder,
                        method: 'on_account',
                        status: 'pending'
                    }, conn);

                    if (debt.appointment_id) await this.syncAppointmentPaymentStatus(debt.appointment_id, currentUserId, conn);
                    if (debt.request_id) await this.syncRequestPaymentStatus(debt.request_id, conn);
                    totalPaid += remaining;
                    remaining = 0;
                }
            }

            if (remaining > 0.01) {
                await transactionRepository.create({
                    type: 'income_patient',
                    amount: remaining,
                    description: 'Advance Payment / Credit',
                    related_user_id: userId,
                    doctor_id: doctor_id || null,
                    method: method,
                    status: 'paid',
                    transaction_date: nowLocalSQL()
                }, conn);
                totalPaid += remaining;
            }

            await conn.commit();
            return totalPaid;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async getTransactions(user, filters) {
        const today = nowLocalSQL().split(' ')[0];

        let patientUserId = null;
        if (filters.patientId) {
            patientUserId = await patientRepository.findUserIdById(filters.patientId);
        }

        const rows = await transactionRepository.findFiltered({
            role: user.role,
            user_id: user.user_id,
            doctor_id: filters.doctor_id,
            patient_user_id: patientUserId,
            institution_id: filters.institution_id,
            today
        });
        return rows;
    }

    async payInstitutionDebt(data, currentUserId) {
        const conn = await pool.getConnection();
        try {
            const { institution_id, amount, method } = data;
            const payAmount = parseFloat(amount);
            if (isNaN(payAmount) || payAmount <= 0) throw new Error("Invalid amount");

            await conn.beginTransaction();
            const debts = await transactionRepository.findPendingByInstitutionId(institution_id, conn);
            let remaining = payAmount;
            let totalPaid = 0;

            for (const debt of debts) {
                if (remaining <= 0.01) break;
                const debtAmount = Number(debt.amount);
                if (remaining >= debtAmount) {
                    await transactionRepository.update(debt.id, {
                        status: 'paid',
                        method,
                        description: `${debt.description} - Paid by Inst`
                    }, conn);

                    if (debt.appointment_id) await this.syncAppointmentPaymentStatus(debt.appointment_id, currentUserId, conn);
                    if (debt.request_id) await this.syncRequestPaymentStatus(debt.request_id, conn);

                    remaining -= debtAmount;
                    totalPaid += debtAmount;
                } else {
                    await transactionRepository.update(debt.id, {
                        status: 'paid',
                        amount: remaining,
                        method,
                        description: `${debt.description} - Paid Part by Inst`
                    }, conn);

                    const remainder = debtAmount - remaining;
                    await transactionRepository.create({
                        ...debt,
                        amount: remainder,
                        method: 'on_account',
                        status: 'pending'
                    }, conn);

                    if (debt.appointment_id) await this.syncAppointmentPaymentStatus(debt.appointment_id, currentUserId, conn);
                    if (debt.request_id) await this.syncRequestPaymentStatus(debt.request_id, conn);

                    totalPaid += remaining;
                    remaining = 0;
                }
            }
            await conn.commit();
            return totalPaid;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async syncAppointmentPaymentStatus(appointmentId, userId, conn) {
        const { totalPaid, totalPending } = await transactionRepository.getPaymentSummary(appointmentId, conn);
        let finalStatus = (totalPaid > 0 && totalPending > 0) ? 'partial' : (totalPaid > 0 ? 'paid' : (totalPending > 0 ? 'debt' : 'pending'));
        await appointmentRepository.update(appointmentId, {
            payment_status: finalStatus,
            is_paid: finalStatus === 'paid' ? 1 : 0
        }, conn);
    }

    async syncRequestPaymentStatus(requestId, conn) {
        const { totalPaid, totalPending } = await transactionRepository.getRequestPaymentSummary(requestId, conn);
        let finalStatus = (totalPaid > 0 && totalPending > 0) ? 'partial' : (totalPaid > 0 ? 'paid' : (totalPending > 0 ? 'debt' : 'pending'));
        await medicalRequestRepository.update(requestId, {
            payment_status: finalStatus,
            debt_amount: totalPending
        }, conn);
    }

    async closeCashBox(data) {
        const { doctor_id, amount_delivered, description } = data;
        const amount = parseFloat(amount_delivered);
        if (isNaN(amount)) throw new Error("Invalid amount");

        await transactionRepository.create({
            type: 'withdrawal',
            amount,
            description,
            doctor_id,
            status: 'paid',
            is_withdrawal: true,
            transaction_date: nowLocalSQL()
        });
    }

    async getPricing(doctorId, patientId, serviceType) {
        return await calculatePrice(pool, doctorId, patientId, serviceType);
    }
}

module.exports = new FinanceService();
