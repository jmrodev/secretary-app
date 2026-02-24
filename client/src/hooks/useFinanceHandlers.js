
import { useCallback } from 'react';
import api from '../api/axios';

export const useFinanceHandlers = ({
    // Contexts
    user,
    t,
    showMessage,
    confirm,
    alert,

    // Data
    transactions,
    pendingClosures,
    duplicateClosures,

    // UI State
    closeBoxModal,
    closeAmount,
    editingTx,

    // Setters / Actions
    setLoading,
    fetchData,
    setEditingTx,
    setModalOpen,
    setHistoricalWithdrawalOpen,
    setPendingClosuresOpen,
    setCloseBoxModal,
    setCloseAmount,
    setSelectedDoctorFilter
}) => {

    const handleDeleteTransaction = useCallback(async (id) => {
        if (!await confirm(t('confirm_delete_transaction') || "¿Eliminar esta operación?")) return;
        try {
            await api.delete(`/finances/transactions/${id}`);
            showMessage(t('transaction_symbol_deleted') || "Operación eliminada", 'success');
            fetchData();
        } catch (err) {
            alert(t('failed_delete_transaction'));
        }
    }, [confirm, t, showMessage, fetchData, alert]);

    const handleUpdateTransaction = useCallback(async () => {
        if (!editingTx) return;
        try {
            await api.put(`/finances/transactions/${editingTx.id}`, editingTx);
            showMessage(t('transaction_updated') || "Transacción actualizada", 'success');
            setEditingTx(null);
            fetchData();
        } catch (err) {
            alert(t('failed_update_transaction'));
        }
    }, [editingTx, t, showMessage, setEditingTx, fetchData, alert]);

    const handleCloseBox = useCallback(async () => {
        try {
            await api.post('/finances/transactions/close', {
                doctor_id: closeBoxModal.doctorId,
                amount_delivered: closeAmount,
                description: `${t('cash_box_delivery_to')} ${closeBoxModal.doctorName}`
            });

            showMessage(t('box_closed_successfully'), 'success');
            setCloseBoxModal(prev => ({ ...prev, open: false }));
            setCloseAmount('');
            fetchData();
        } catch (err) {
            alert(t('failed_close_box'));
        }
    }, [closeBoxModal, closeAmount, t, showMessage, setCloseBoxModal, setCloseAmount, fetchData, alert]);

    const handleGenerateInvoice = useCallback(async (transactionId) => {
        if (!await confirm(t('confirm_generate_invoice') || "¿Generar factura electrónica?")) return;
        try {
            const res = await api.post('/billing/invoice', { transactionId, cbteTipo: 11 });
            const msg = t('invoice_generated_success')?.replace('{number}', res.data.invoice.number) || `Factura: ${res.data.invoice.number}`;
            showMessage(msg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.error || t('error_generating_invoice') || "Error al generar factura", 'error');
        }
    }, [confirm, showMessage, fetchData, t]);

    const handleSyncTransaction = useCallback(async (transactionId) => {
        try {
            await api.post(`/google/sync-transaction/${transactionId}`);
            showMessage(t('google_sync_success') || "Sincronizado", 'success');
        } catch (err) {
            console.error(err);
            showMessage(t('google_sync_error') || "Error sync", 'error');
        }
    }, [showMessage, t]);

    const handleHistoricalWithdrawal = useCallback(async (data) => {
        try {
            const dateTime = `${data.date} ${data.time}:00`;
            await api.post('/finances/transactions', {
                type: 'withdrawal',
                amount: data.amount,
                description: `${data.description} (${t('manual_closure')})`,
                doctor_id: data.doctor_id,
                transaction_date: dateTime,
                status: 'paid',
                method: 'cash',
                is_withdrawal: true
            });

            showMessage(t('withdrawal_success') || "Retiro registrado exitosamente", 'success');
            setHistoricalWithdrawalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(t('failed_save_withdrawal') || "Error al guardar retiro");
        }
    }, [t, showMessage, setHistoricalWithdrawalOpen, fetchData, alert]);

    const handleAutoClosure = useCallback(async (dayData) => {
        try {
            let [h, m] = dayData.lastTime.split(':').map(Number);
            m += 1;
            if (m >= 60) { h++; m = 0; }
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            const dateTime = `${dayData.date} ${timeStr}`;
            const docId = dayData.doctor_id;

            setLoading(true);
            if (dayData.balance > 0) {
                await api.post('/finances/transactions', {
                    type: 'withdrawal', amount: dayData.balance, description: `${t('auto_closure')} (${dayData.date}) - ${t('cash') || 'Efectivo'}`,
                    doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'cash', is_withdrawal: true
                });
            }
            if (dayData.transferBalance > 0) {
                await api.post('/finances/transactions', {
                    type: 'withdrawal', amount: dayData.transferBalance, description: `${t('auto_closure')} (${dayData.date}) - ${t('transfer') || 'Transferencia'}`,
                    doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'transfer', is_withdrawal: true
                });
            }
            const successMsg = t('box_closed_success_msg')
                ?.replace('{name}', dayData.doctor_name)
                ?.replace('{date}', dayData.date) || `Cerrada: ${dayData.doctor_name}`;
            showMessage(successMsg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(t('error_processing_closure') || "Error al procesar el cierre", 'error');
        } finally {
            setLoading(false);
        }
    }, [setLoading, showMessage, fetchData, t]);

    const handleCloseAllPending = useCallback(async () => {
        if (!pendingClosures.length) return;
        const confirmMsg = t('confirm_close_all_pending')?.replace('{count}', pendingClosures.length) || `¿Cerrar ${pendingClosures.length}?`;
        if (!await confirm(confirmMsg)) return;

        setLoading(true);
        try {
            for (const day of pendingClosures) {
                let [h, m] = day.lastTime.split(':').map(Number);
                m += 1;
                if (m >= 60) { m = 0; h += 1; }
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
                const dateTime = `${day.date} ${timeStr}`;
                const docId = day.doctor_id;

                if (day.balance > 0) {
                    await api.post('/finances/transactions', {
                        type: 'withdrawal', amount: day.balance, description: `${t('auto_closure')} (${day.date}) - ${t('cash') || 'Efectivo'}`,
                        doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'cash', is_withdrawal: true
                    });
                }
                if (day.transferBalance > 0) {
                    await api.post('/finances/transactions', {
                        type: 'withdrawal', amount: day.transferBalance, description: `${t('auto_closure')} (${day.date}) - ${t('transfer') || 'Transferencia'}`,
                        doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'transfer', is_withdrawal: true
                    });
                }
            }
            const successMsg = t('close_all_success_msg')?.replace('{count}', pendingClosures.length) || `Cerradas: ${pendingClosures.length}`;
            showMessage(successMsg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(t('error_close_all') || "Error al cerrar todas", 'error');
        } finally {
            setLoading(false);
        }
    }, [pendingClosures, confirm, setLoading, showMessage, fetchData, t]);

    const handleFixDuplicates = useCallback(async () => {
        if (!duplicateClosures.length) return;

        const confirmMsg = t('confirm_fix_duplicates')?.replace('{count}', duplicateClosures.length) || `Conflictos: ${duplicateClosures.length}. ¿Corregir?`;
        if (!await confirm(confirmMsg)) return;

        try {
            setLoading(true);
            let deletedCount = 0;
            for (const day of duplicateClosures) {
                for (const id of day.ids) {
                    await api.delete(`/finances/transactions/${id}`);
                    deletedCount++;
                }
            }
            const successMsg = t('fix_duplicates_success_msg')?.replace('{count}', deletedCount) || `Corregidos: ${deletedCount}`;
            showMessage(successMsg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            alert(t('error_fix_duplicates') || "Error al corregir duplicados.");
        } finally {
            setLoading(false);
        }
    }, [duplicateClosures, confirm, setLoading, showMessage, fetchData, alert, t]);

    const handleResetDay = useCallback(async (date, doctorId) => {
        const toDeleteIds = transactions
            .filter(t => {
                const isWithdrawal = t.is_withdrawal === 1 || t.is_withdrawal === true || t.type === 'withdrawal';
                const desc = t.description || '';
                const dateInDesc = desc.match(/\d{4}-\d{2}-\d{2}/);
                const tDate = dateInDesc ? dateInDesc[0] : (t.transaction_date && String(t.transaction_date).split(' ')[0].split('T')[0]);

                const matchesDate = tDate === date;
                const matchesDoctor = String(t.doctor_id) === String(doctorId) ||
                    (t.doctor_id === null && (doctorId === 'null' || !doctorId));

                return isWithdrawal && matchesDate && matchesDoctor;
            })
            .map(t => t.id);

        if (toDeleteIds.length === 0) {
            showMessage(t('no_withdrawals_found') || "No hay entregas.", "info");
            return;
        }

        const confirmMsg = t('confirm_reset_day')?.replace('{count}', toDeleteIds.length) || `Eliminar ${toDeleteIds.length} entregas?`;
        if (!await confirm(confirmMsg)) return;

        try {
            setLoading(true);
            for (const id of toDeleteIds) {
                await api.delete(`/finances/transactions/${id}`);
            }
            const successMsg = t('reset_day_success_msg')?.replace('{date}', date) || `Reseteado: ${date}`;
            showMessage(successMsg, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(t('error_reset_day') || "Error al resetear", 'error');
        } finally {
            setLoading(false);
        }
    }, [transactions, showMessage, confirm, setLoading, fetchData, t]);

    return {
        onRefresh: fetchData,
        onDeleteTransaction: handleDeleteTransaction,
        onUpdateTransaction: handleUpdateTransaction,
        onCloseBox: handleCloseBox,
        onSelectDoctor: setSelectedDoctorFilter,
        onEditTransaction: setEditingTx,
        onOpenNewTransaction: () => setModalOpen(true),
        onCloseNewTransaction: () => setModalOpen(false),
        onOpenCloseBox: (doctor, balance) => {
            setCloseBoxModal({ open: true, doctorId: doctor.id, doctorName: doctor.full_name, balance: balance });
            setCloseAmount(balance);
        },
        onCloseCloseBox: () => setCloseBoxModal(prev => ({ ...prev, open: false })),
        onGenerateInvoice: handleGenerateInvoice,
        onSyncTransaction: handleSyncTransaction,
        handleHistoricalWithdrawal,
        handleAutoClosure,
        handleCloseAllPending,
        handleFixDuplicates,
        handleResetDay,
        setCloseAmount,
        setEditingTx,
        setHistoricalWithdrawalOpen,
        setPendingClosuresOpen
    };
};
