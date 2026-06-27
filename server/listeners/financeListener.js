const eventBus = require('../events/eventBus');
const EVENTS = require('../events/eventConstants');
const transactionRepository = require('../repositories/finance/transactionRepository');
const { pool } = require('../db');

eventBus.on(EVENTS.MEDICAL_REQUEST_UPDATED, async (payload) => {
    try {
        const { id, amount, paymentMethod, conn } = payload;
        if (amount !== undefined) {
            await transactionRepository.updateByRequestId(id, { amount }, conn);
        }
        if (paymentMethod !== undefined) {
            await transactionRepository.updateByRequestId(id, { method: paymentMethod }, conn);
        }
    } catch (error) {
        console.error('Error en FinanceListener al actualizar transacción:', error);
    }
});

eventBus.on(EVENTS.MEDICAL_REQUEST_CREATED, async (_payload) => {
    try {
        // Logica para crear transaccion
    } catch (error) {
        console.error('Error en FinanceListener al crear transacción:', error);
    }
});

eventBus.on(EVENTS.MEDICAL_REQUEST_DELETED, async (payload) => {
    try {
        const { id, conn } = payload;
        await transactionRepository.deleteByRequestId(id, conn);
    } catch (error) {
        console.error('Error en FinanceListener al borrar transacción de solicitud médica:', error);
    }
});

eventBus.on(EVENTS.APPOINTMENT_CANCELLED, async (payload) => {
    try {
        const { id, conn } = payload;
        const activeConn = conn || pool;
        // Solo borramos deudas pendientes al cancelar/ausente
        await activeConn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
        await activeConn.query("CALL sp_sync_appointment_payment_status(?)", [id]);
    } catch (error) {
        console.error('Error en FinanceListener al cancelar transacción de turno:', error);
    }
});

eventBus.on(EVENTS.APPOINTMENT_DELETED, async (payload) => {
    try {
        const { id, payment_status, conn } = payload;
        const activeConn = conn || pool;
        if (payment_status === 'paid') {
            await activeConn.query("UPDATE transactions SET description = CONCAT('Saldo a favor (Turno Eliminado): ', description) WHERE appointment_id = ? AND status = 'paid'", [id]);
        } else {
            await activeConn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
        }
        await activeConn.query("CALL sp_sync_appointment_payment_status(?)", [id]);
    } catch (error) {
        console.error('Error en FinanceListener al borrar transacción de turno eliminado:', error);
    }
});
