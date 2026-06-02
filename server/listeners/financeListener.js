const eventBus = require('../events/eventBus');
const EVENTS = require('../events/eventConstants');
const transactionRepository = require('../repositories/finance/transactionRepository');

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
        console.error('Error en FinanceListener al borrar transacción:', error);
    }
});
