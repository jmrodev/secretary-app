const transactionRepository = require('../../repositories/finance/transactionRepository');

const DEBT_LABEL = 'Deuda (Turno Eliminado)';
const CREDIT_LABEL = 'Saldo a favor (Turno Eliminado)';

// Statuses whose service was rendered: pending debt must be retained, not removed.
const RENDERED_STATUSES = ['completed', 'absent'];

/**
 * DebtLifecycleService
 *
 * Centralizes the R1-R7 debt policy for appointment deletion/status changes and
 * medical request deletion. All mutations run on the SAME DB `conn` as the
 * triggering operation so they are atomic with it (any throw rolls back the debt
 * changes together with the appointment/request change).
 *
 * Labels are description prefixes (no schema change):
 *   - `Deuda (Turno Eliminado)`  : retained pending debt (rendered service)
 *   - `Saldo a favor (Turno Eliminado)` : paid transactions of a cancelled appointment
 */
class DebtLifecycleService {
    async handleAppointmentDelete(conn, appt) {
        const txs = await transactionRepository.findByAppointmentId(appt.id, conn);
        const pendingIds = txs.filter((tx) => tx.status === 'pending').map((tx) => tx.id);
        const paidIds = txs.filter((tx) => tx.status === 'paid').map((tx) => tx.id);

        if (RENDERED_STATUSES.includes(appt.status)) {
            // R2/R4: rendered service keeps pending debt, detached and labeled; paid income untouched.
            if (pendingIds.length > 0) {
                await transactionRepository.detachAndLabel(pendingIds, DEBT_LABEL, conn);
            }
            return;
        }

        if (appt.status === 'cancelled') {
            // R5: cancel removes pending debt.
            if (pendingIds.length > 0) {
                await transactionRepository.deletePendingByAppointmentId(appt.id, conn);
            }
            // R6: paid appointment deleted after cancel -> credit balance.
            if (appt.payment_status === 'paid' && paidIds.length > 0) {
                await transactionRepository.detachAndLabel(paidIds, CREDIT_LABEL, conn);
            }
            return;
        }

        if (appt.status === 'suspended') {
            // Legacy behavior preserved: suspended deletes pending debt and clears payment_status.
            if (pendingIds.length > 0) {
                await transactionRepository.deletePendingByAppointmentId(appt.id, conn);
            }
            await conn.query("UPDATE appointments SET payment_status = NULL WHERE id = ?", [appt.id]);
            return;
        }

        // R1/R3: no rendered service -> no pending debt.
        if (pendingIds.length > 0) {
            await transactionRepository.deletePendingByAppointmentId(appt.id, conn);
        }
    }

    async handleAppointmentStatusChange(conn, appt, status) {
        if (status === 'absent') {
            // R4: absent keeps pending debt and payment_status (counts toward active debt).
            return;
        }

        const txs = await transactionRepository.findByAppointmentId(appt.id, conn);
        const pendingIds = txs.filter((tx) => tx.status === 'pending').map((tx) => tx.id);
        const paidIds = txs.filter((tx) => tx.status === 'paid').map((tx) => tx.id);

        if (status === 'cancelled') {
            // R5: cancel removes pending debt.
            if (pendingIds.length > 0) {
                await transactionRepository.deletePendingByAppointmentId(appt.id, conn);
            }
            // R6: paid appointment cancelled -> credit balance.
            if (appt.payment_status === 'paid' && paidIds.length > 0) {
                await transactionRepository.detachAndLabel(paidIds, CREDIT_LABEL, conn);
            }
            return;
        }

        if (status === 'suspended') {
            // Legacy behavior preserved: suspended deletes pending debt.
            // payment_status clearing is handled by modificationService's update payload.
            if (pendingIds.length > 0) {
                await transactionRepository.deletePendingByAppointmentId(appt.id, conn);
            }
        }
    }

    async handleRequestDelete(conn, reqInfo) {
        const txs = await transactionRepository.findByRequestId(reqInfo.id, conn);
        const pendingIds = txs.filter((tx) => tx.status === 'pending').map((tx) => tx.id);

        if (reqInfo.status === 'completed') {
            // R7: performed request keeps pending debt as standalone labeled patient debt.
            if (pendingIds.length > 0) {
                await transactionRepository.detachAndLabel(pendingIds, DEBT_LABEL, conn);
            }
            return;
        }

        // R7: unperformed request (pending/rejected/cancelled) removes pending debt; paid income unchanged.
        if (pendingIds.length > 0) {
            await transactionRepository.deletePendingByRequestId(reqInfo.id, conn);
        }
    }
}

module.exports = new DebtLifecycleService();
module.exports.DEBT_LABEL = DEBT_LABEL;
module.exports.CREDIT_LABEL = CREDIT_LABEL;