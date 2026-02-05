
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';

export const useFinancesPageController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm } = useModal();
    const { settings } = useConfig();

    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingTx, setEditingTx] = useState(null);

    // Lists
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // Filters
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState(localStorage.getItem('last_selected_doctor_id') || '');

    // New Transaction Form State
    const [modalOpen, setModalOpen] = useState(false);

    // Cash Close State
    const [closeBoxModal, setCloseBoxModal] = useState({ open: false, doctorId: '', doctorName: '', balance: 0 });
    const [closeAmount, setCloseAmount] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Transactions (Corrected Endpoint)
            const res = await api.get(`/finances/transactions?doctor_id=${selectedDoctorFilter}`);
            setTransactions(res.data);

            // Fetch Stats
            // Only fetch stats if role allows
            if (user.role === 'admin' || user.role === 'secretary') {
                try {
                    const statsRes = await api.get(`/finances/stats?doctor_id=${selectedDoctorFilter}`);
                    setStats(statsRes.data);
                } catch (statsErr) {
                    console.error("Failed to fetch stats", statsErr);
                }

                // Fetch Lists if not already loaded (or should we reload always? safe to reload)
                const pRes = await api.get('/users/patients');
                setPatients(pRes.data);
                const dRes = await api.get('/users/doctors');
                setDoctors(dRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user.role, selectedDoctorFilter]);

    useEffect(() => {
        fetchData();
        localStorage.setItem('last_selected_doctor_id', selectedDoctorFilter);
    }, [fetchData, selectedDoctorFilter]);

    const handleDeleteTransaction = async (id) => {
        if (!await confirm(t('confirm_delete_transaction') || "¿Eliminar esta transacción? Esto podría afectar el estado de pago del turno.")) return;
        try {
            await api.delete(`/finances/transactions/${id}`);
            showMessage(t('transaction_symbol_deleted') || "Transacción eliminada", 'success');
            fetchData();
        } catch (err) {
            alert(t('failed_delete_transaction'));
        }
    };

    const handleUpdateTransaction = async () => {
        try {
            await api.put(`/finances/transactions/${editingTx.id}`, editingTx);
            showMessage(t('transaction_updated') || "Transacción actualizada", 'success');
            setEditingTx(null);
            fetchData();
        } catch (err) {
            alert(t('failed_update_transaction'));
        }
    };

    const handleCloseBox = async () => {
        try {
            await api.post('/finances/transactions/close', {
                doctor_id: closeBoxModal.doctorId,
                amount_delivered: closeAmount,
                description: `Cash Box Delivery to Dr. ${closeBoxModal.doctorName}`
            });

            showMessage(t('box_closed_successfully'), 'success');
            setCloseBoxModal({ ...closeBoxModal, open: false });
            setCloseAmount('');
            fetchData();
        } catch (err) {
            alert(t('failed_close_box'));
        }
    };

    const handleGenerateInvoice = async (transactionId) => {
        if (!await confirm("¿Generar factura electrónica para esta transacción?")) return;
        try {
            const res = await api.post('/billing/invoice', { transactionId, cbteTipo: 11 }); // Default to Type 11 (C)
            showMessage(`Factura Generada: ${res.data.invoice.number}`, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.error || "Error al generar factura", 'error');
        }
    };

    const handleSyncTransaction = async (transactionId) => {
        try {
            await api.post(`/google/sync-transaction/${transactionId}`);
            showMessage("Sincronización con Google Sheet completada", 'success');
        } catch (err) {
            console.error(err);
            showMessage("Error al sincronizar con Google", 'error');
        }
    };

    // Optimized Pre-calculations
    const balancesByDoctor = useMemo(() => {
        const results = {};
        transactions.forEach(t => {
            if (t.status !== 'paid') return;
            const docId = t.doctor_id;
            if (!results[docId]) {
                results[docId] = { cash: 0, transfer: 0, total: 0 };
            }

            const amount = parseFloat(t.amount) || 0;
            const isWithdrawal = t.is_withdrawal;
            const isIncome = t.type.includes('income');
            const isExpense = t.type.includes('expense');

            let delta = 0;
            if (isWithdrawal) delta = -amount;
            else if (isIncome) delta = amount;
            else if (isExpense) delta = -amount;

            if (t.method === 'cash') {
                results[docId].cash += delta;
            } else if (t.method === 'transfer') {
                results[docId].transfer += delta;
            }
            results[docId].total += delta;
        });
        return results;
    }, [transactions]);

    // Fast lookups
    const calculateBalance = useCallback((docId) => {
        return balancesByDoctor[docId]?.total || 0;
    }, [balancesByDoctor]);

    const calculateBalanceByMethod = useCallback((docId) => {
        const b = balancesByDoctor[docId] || { cash: 0, transfer: 0, total: 0 };
        return b;
    }, [balancesByDoctor]);

    const handlers = {
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
        setCloseAmount,
        setEditingTx,
        calculateBalance,
        calculateBalanceByMethod
    };

    return {
        // State
        transactions,
        stats,
        loading,
        doctors,
        patients,
        selectedDoctorFilter,
        modalOpen, // New Tx Modal
        closeBoxModal,
        closeAmount,
        editingTx,

        // Context
        user,
        settings,
        t,

        // Modals
        alert,
        confirm,

        // Handlers
        handlers
    };
};
