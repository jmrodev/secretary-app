const transactionRepository = require('../../repositories/finance/transactionRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const { pool } = require('../../db');
const { formatLocalSQL, nowLocalSQL } = require('../../utils/core/dateUtils');
const { calculatePrice } = require('../../utils/finance/priceCalculator');

/**
 * FinanceService (ECC Optimized - High Performance Edition)
 */
class FinanceService {
    async createTransaction(data, userId, conn = null) {
        if (!data.doctor_id) throw new Error("Doctor ID is required");

        if (data.payments && typeof data.payments === 'string') {
            try {
                data.payments = JSON.parse(data.payments);
            } catch (err) {
                console.warn("[FinanceService] payments parsing failed:", err.message);
            }
        }

        const connection = conn || await pool.getConnection();
        // ECC: Generate global idempotency key if not provided
        const idempotencyKey = data.idempotency_key || `idp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            if (!conn) await connection.beginTransaction();
            const finalDate = formatLocalSQL(data.transaction_date) || nowLocalSQL();
            
            if (!data.type) {
                if (data.appointment_id) data.type = 'income_patient';
                else if (data.request_id) data.type = 'income_request';
                else data.type = 'income';
            }

            let relatedUserId = data.related_user_id || data.patientUserId || null;
            if (relatedUserId) {
                const userRows = await connection.query("SELECT id FROM users WHERE id = ?", [relatedUserId]);
                if (!userRows || userRows.length === 0) {
                    const mappedUserId = await patientRepository.findUserIdById(relatedUserId, connection);
                    if (mappedUserId) {
                        console.warn(`[ECC-Finance] Mapped misaligned related_user_id (patient_id) ${relatedUserId} to user_id ${mappedUserId}`);
                        relatedUserId = mappedUserId;
                    } else {
                        console.warn(`[ECC-Finance] Invalid related_user_id ${relatedUserId} (does not exist in users or patients), setting to null`);
                        relatedUserId = null;
                    }
                }
            }

            if (!relatedUserId && (data.patient_id || data.patientId)) {
                relatedUserId = await patientRepository.findUserIdById(data.patient_id || data.patientId, connection);
            }

            let lastTransactionId = null;
            let paymentsList = [];

            if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
                paymentsList = data.payments;
            } else if (data.amount) {
                paymentsList = [{ amount: data.amount, method: data.method || 'cash' }];
            }

            // Sequential processing with per-item idempotency
            for (let i = 0; i < paymentsList.length; i++) {
                const p = paymentsList[i];
                const amount = parseFloat(p.amount);
                if (isNaN(amount) || amount <= 0) continue;

                // Check if there is an existing pending transaction for this appointment
                if (data.appointment_id) {
                    const pendingRows = await connection.query(
                        "SELECT id FROM transactions WHERE appointment_id = ? AND status = 'pending' LIMIT 1",
                        [data.appointment_id]
                    );
                    if (pendingRows && pendingRows.length > 0) {
                        const pendingTx = pendingRows[0];
                        await connection.query(
                            `UPDATE transactions SET 
                                status = 'paid', 
                                amount = ?, 
                                method = ?, 
                                description = ?, 
                                transaction_date = ?
                             WHERE id = ?`,
                            [
                                amount,
                                p.method || 'cash',
                                data.description || 'Pago de Turno',
                                finalDate,
                                pendingTx.id
                            ]
                        );
                        lastTransactionId = pendingTx.id;
                        continue;
                    }
                }

                lastTransactionId = await transactionRepository.callSpCreateTransaction({
                    ...data,
                    amount,
                    method: p.method || 'cash',
                    related_user_id: relatedUserId,
                    transaction_date: finalDate,
                    idempotency_key: `${idempotencyKey}_${i}`
                }, connection);
            }

            // Handle debt
            const debtAmount = parseFloat(data.debt_amount);
            if (!isNaN(debtAmount) && debtAmount > 0) {
                await transactionRepository.callSpCreateTransaction({
                    ...data,
                    amount: debtAmount,
                    status: 'pending',
                    description: `${data.description || 'Saldo'} (Pendiente)`,
                    related_user_id: relatedUserId,
                    transaction_date: finalDate,
                    idempotency_key: `${idempotencyKey}_debt`
                }, connection);
            }

            // Sync status of appointment or request if applicable
            if (data.appointment_id) {
                await connection.query("CALL sp_sync_appointment_payment_status(?)", [data.appointment_id]);
            }
            if (data.request_id || data.requestId) {
                const reqId = data.request_id || data.requestId;
                await connection.query("CALL sp_sync_request_payment_status(?)", [reqId]);
            }
            if (data.rental_id || data.rentalId) {
                const rentId = data.rental_id || data.rentalId;
                await connection.query("CALL sp_sync_rental_payment_status(?)", [rentId]);
            }

            if (!conn) await connection.commit();
            return { id: lastTransactionId, idempotencyKey };
        } catch (err) {
            if (!conn) await connection.rollback();
            throw err;
        } finally {
            if (!conn) connection.release();
        }
    }

    async getTransactions(user, filters) {
        const today = nowLocalSQL().split(' ')[0];
        const limit = parseInt(filters.limit) || 50;
        const page = parseInt(filters.page) || 1;
        const offset = (page - 1) * limit;

        const [transactions, totalCount] = await Promise.all([
            transactionRepository.findFiltered({ ...filters, today, limit, offset }),
            transactionRepository.countFiltered({ ...filters, today })
        ]);
        return { transactions, totalCount };
    }

    async getPricing(doctorId, patientId, serviceType) {
        return await calculatePrice(pool, doctorId, patientId, serviceType);
    }

    async getPendingClosures(doctorId) {
        return await transactionRepository.findPendingClosures(doctorId);
    }

    /**
     * ECC: Perform Automatic Cash Box Balancing (Arqueo)
     */
    async performBalancing(data, userId) {
        const { doctor_id, balancing_date, theoretical_balance, physical_balance, notes } = data;
        const difference = parseFloat(physical_balance) - parseFloat(theoretical_balance);
        
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Record the balancing event
            await conn.query(`
                INSERT INTO cash_box_balancings (doctor_id, balancing_date, theoretical_balance, physical_balance, difference, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [doctor_id, balancing_date, theoretical_balance, physical_balance, difference, notes]);

            // 2. Create the withdrawal transaction to reset the balance
            await this.createTransaction({
                type: 'withdrawal',
                amount: parseFloat(physical_balance),
                method: 'cash',
                description: `Cierre de Caja: ${balancing_date} ${notes ? ' - ' + notes : ''}`,
                doctor_id: doctor_id,
                status: 'paid',
                is_withdrawal: true,
                transaction_date: `${balancing_date} 23:59:59`,
                idempotency_key: `closure_${doctor_id}_${balancing_date}`
            }, userId, conn);

            await conn.commit();
            return { difference, success: true };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async payDebt(data, _userId) {
        const payAmount = parseFloat(data.amount);
        if (isNaN(payAmount) || payAmount <= 0) throw new Error("Invalid amount");
        
        if (data.patientId) {
            const idempotencyKey = data.idempotency_key || `pay_pat_${data.patientId}_${Date.now()}`;
            await pool.query("CALL proc_pay_patient_debt(?, ?, ?, ?, ?, ?)", [
                data.patientId, payAmount, data.method, data.doctor_id || null, 'PAGO_DEUDA', idempotencyKey
            ]);
            return { amount: payAmount, idempotencyKey };
        } else if (data.doctorId) {
            const idempotencyKey = data.idempotency_key || `pay_doc_${data.doctorId}_${Date.now()}`;
            await pool.query("CALL proc_pay_doctor_debt(?, ?, ?, ?, ?)", [
                data.doctorId, payAmount, data.method, 'PAGO_ALQUILER', idempotencyKey
            ]);
            return { amount: payAmount, idempotencyKey };
        } else {
            throw new Error("Patient ID or Doctor ID is required to pay debt");
        }
    }

    async syncRequestPaymentStatus(requestId, conn = pool) {
        await conn.query("CALL sp_sync_request_payment_status(?)", [requestId]);
    }

    async markAsBonified(id, type, conn = pool) {
        await transactionRepository.callSpMarkAsBonified(id, type, conn);
    }
}

module.exports = new FinanceService();
