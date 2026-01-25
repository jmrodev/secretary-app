
import { useState, useEffect, useCallback } from 'react';
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

    // Calculate Balance for a specific doctor from loaded transactions (Frontend Calc for instant feedback)
    const calculateBalance = (docId) => {
        return transactions
            .filter(t => t.doctor_id == docId && t.status === 'paid')
            .reduce((acc, t) => {
                if (t.is_withdrawal) return acc - parseFloat(t.amount);
                if (t.type.includes('income')) return acc + parseFloat(t.amount);
                if (t.type.includes('expense')) return acc - parseFloat(t.amount);
                return acc;
            }, 0);
    };

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
        setCloseAmount,
        setEditingTx,
        calculateBalance
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

        // Handlers
        handlers
    };
};
