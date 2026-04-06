const fs = require('fs');
const path = require('path');

const file = path.join('server', 'services', 'finance', 'financeService.js');
let code = fs.readFileSync(file, 'utf8');

const newPayInstitutionDebt = `
    async payInstitutionDebt(data, currentUserId) {
        const conn = await pool.getConnection();
        try {
            const { institution_id, amount, method, transaction_ids } = data;
            const payAmount = parseFloat(amount);
            if (isNaN(payAmount) || payAmount <= 0) throw new Error("Invalid amount");

            await conn.beginTransaction();
            let debts = await transactionRepository.findPendingByInstitutionId(institution_id, conn);

            // Si se envían IDs específicos (desde checkboxes), pagar solo esos
            if (Array.isArray(transaction_ids) && transaction_ids.length > 0) {
                const idSet = new Set(transaction_ids.map(Number));
                debts = debts.filter(debt => idSet.has(Number(debt.id)));
            }

            let remaining = payAmount;
            let totalPaid = 0;

            const fullyPaidIds = [];
            const syncAppointments = new Set();
            const syncRequests = new Set();
            let partialUpdate = null;
            let partialCreate = null;

            for (const debt of debts) {
                if (remaining <= 0.01) break;
                const debtAmount = Number(debt.amount);

                if (remaining >= debtAmount) {
                    fullyPaidIds.push(debt.id);
                    if (debt.appointment_id) syncAppointments.add(debt.appointment_id);
                    if (debt.request_id) syncRequests.add(debt.request_id);

                    remaining -= debtAmount;
                    totalPaid += debtAmount;
                } else {
                    partialUpdate = {
                        id: debt.id,
                        updates: {
                            status: 'paid',
                            amount: remaining,
                            method,
                            description: \`\${debt.description} - Paid Part by Inst\`
                        }
                    };

                    const remainder = debtAmount - remaining;
                    partialCreate = {
                        ...debt,
                        amount: remainder,
                        method: 'on_account',
                        status: 'pending'
                    };

                    if (debt.appointment_id) syncAppointments.add(debt.appointment_id);
                    if (debt.request_id) syncRequests.add(debt.request_id);

                    totalPaid += remaining;
                    remaining = 0;
                }
            }

            // Execute all DB operations in parallel using Promise.all or batched queries
            const promises = [];

            if (fullyPaidIds.length > 0) {
                // Batch update fully paid debts
                // Since transactionRepository.update doesn't support bulk out of the box, we can do a raw query here,
                // or just map to multiple update calls. But raw query is faster.
                const placeholders = fullyPaidIds.map(() => '?').join(',');
                promises.push(conn.query(
                    \`UPDATE transactions SET status = 'paid', method = ?, description = CONCAT(description, ' - Paid by Inst') WHERE id IN (\${placeholders})\`,
                    [method, ...fullyPaidIds]
                ));
            }

            if (partialUpdate) {
                promises.push(transactionRepository.update(partialUpdate.id, partialUpdate.updates, conn));
            }

            if (partialCreate) {
                promises.push(transactionRepository.create(partialCreate, conn));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }

            // Sync statuses
            const syncPromises = [];
            for (const appointmentId of syncAppointments) {
                syncPromises.push(this.syncAppointmentPaymentStatus(appointmentId, currentUserId, conn));
            }
            for (const requestId of syncRequests) {
                syncPromises.push(this.syncRequestPaymentStatus(requestId, conn));
            }
            if (syncPromises.length > 0) {
                await Promise.all(syncPromises);
            }

            if (remaining > 0.01) {
                const { nowLocalSQL } = require('../../utils/dateUtils');
                await transactionRepository.create({
                    type: 'income_institution',
                    amount: remaining,
                    description: 'Pago Adelantado / Crédito Institución',
                    institution_id: institution_id,
                    doctor_id: null,
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
`;

const regex = /async payInstitutionDebt\(data, currentUserId\) \{[\s\S]*?(?=async syncAppointmentPaymentStatus)/;
code = code.replace(regex, newPayInstitutionDebt);
fs.writeFileSync(file, code);
