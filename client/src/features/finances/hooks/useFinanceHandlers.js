import { useCallback } from 'react';
import { api } from '@/api/axios';

/**
 * ECC-Pattern: useFinanceHandlers Hook
 * Orchestrates all financial actions (payments, closures, balancing).
 */
export const useFinanceHandlers = ({
    user, t, showMessage, confirm,
    transactions, pendingClosures, duplicateClosures,
    closeBoxModal, closeAmount, editingTx,
    setLoading, fetchData, setEditingTx, setModalOpen,
    setPendingClosuresOpen,
    setCloseBoxModal, setCloseAmount, setSelectedDoctorFilter
}) => {

    const handleDeleteTransaction = useCallback(async (id) => {
        if (!await confirm(t('confirm_delete_transaction'))) return;
        try {
            await api.delete(`/finances/transactions/${id}`);
            showMessage(t('transaction_symbol_deleted'), 'success');
            fetchData();
        } catch (err) { console.error('[useFinanceHandlers] Delete transaction failed:', err); showMessage(t('failed_delete_transaction'), 'error'); }
    }, [confirm, t, showMessage, fetchData]);

    /**
     * ECC: High-Performance Auto-Balancing (Arqueo)
     * Calls the dedicated balancing endpoint with idempotency.
     */
    const handleAutoClosure = useCallback(async (balancingData) => {
        setLoading(true);
        try {
            // If called from the new balancing UI, it comes as an object
            const payload = balancingData.doctor_id ? balancingData : {
                doctor_id: balancingData.doctor_id,
                balancing_date: balancingData.date,
                theoretical_balance: balancingData.balance,
                physical_balance: balancingData.balance, // Default to full delivery
                notes: 'Cierre automático'
            };

            const res = await api.post('/finances/cash-box/balancing', payload);
            const { difference } = res.data.data;

            let msg = t('box_closed_success_msg');
            if (difference !== 0) {
                msg += `. Diferencia: $${difference.toLocaleString()}`;
            }
            
            showMessage(msg, difference === 0 ? 'success' : 'warning');
            fetchData();
        } catch (err) {
            console.error("[ECC-Finance] Balancing error:", err);
            showMessage(t('error_processing_closure'), 'error');
        } finally {
            setLoading(false);
        }
    }, [setLoading, showMessage, fetchData, t]);

    const handleGenerateInvoice = useCallback(async (transactionId) => {
        if (!await confirm(t('confirm_generate_invoice'))) return;
        try {
            const res = await api.post('/billing/invoice', { transactionId, cbteTipo: 11 });
            const msg = t('invoice_generated_success')?.replace('{number}', res.data.invoice.number) || `Factura: ${res.data.invoice.number}`;
            showMessage(msg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.error || t('error_generating_invoice'), 'error');
        }
    }, [confirm, showMessage, fetchData, t]);

    const handleResetDay = useCallback(async (date, doctorId) => {
        const toDeleteIds = transactions.reduce((acc, tran) => {
            const isWithdrawal = tran.is_withdrawal === 1 || tran.is_withdrawal === true || tran.type === 'withdrawal';
            const matchesDate = tran.transaction_date?.split('T')[0] === date;
            const matchesDoctor = String(tran.doctor_id) === String(doctorId);

            if (isWithdrawal && matchesDate && matchesDoctor) acc.push(tran.id);
            return acc;
        }, []);

        if (toDeleteIds.length === 0) return showMessage(t('no_withdrawals_found'), "info");
        if (!await confirm(t('confirm_reset_day'))) return;

        setLoading(true);
        try {
            await Promise.all(toDeleteIds.map(id => api.delete(`/finances/transactions/${id}`)));
            showMessage(t('reset_day_success_msg'), 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(t('error_reset_day'), 'error');
        } finally { setLoading(false); }
    }, [transactions, showMessage, confirm, setLoading, fetchData, t]);

    return {
        onRefresh: fetchData,
        onDeleteTransaction: handleDeleteTransaction,
        handleAutoClosure,
        handleResetDay,
        onSelectDoctor: setSelectedDoctorFilter,
        onEditTransaction: setEditingTx,
        onOpenNewTransaction: () => setModalOpen(true),
        onCloseNewTransaction: () => setModalOpen(false),
        onGenerateInvoice: handleGenerateInvoice,
        setEditingTx,
        setPendingClosuresOpen
    };
};
