import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../auth';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';
import { useMessage } from '../../../context/MessageContext';
import { useConfig } from '../../../context/ConfigContext';
import { useFinanceHandlers } from './useFinanceHandlers';

export const useFinancesPageController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm } = useModal();
    const { settings } = useConfig();

    // --- Transactions State ---
    const [transactions, setTransactions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [loading, setLoading] = useState(true);

    // --- Global Stats & Lists ---
    const [stats, setStats] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [pendingClosures, setPendingClosures] = useState([]);
    
    // --- UI State ---
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingClosuresOpen, setPendingClosuresOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [closeBoxModal, setCloseBoxModal] = useState({ open: false, doctorId: '', doctorName: '', balance: 0 });
    const [closeAmount, setCloseAmount] = useState('');
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState(localStorage.getItem('last_selected_doctor_id') || '');

    // --- Search & Filters ---
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [txRes, statsRes, dRes, closuresRes] = await Promise.all([
                api.get('/finances/transactions', {
                    params: {
                        doctor_id: selectedDoctorFilter || 'all',
                        page: currentPage,
                        limit: itemsPerPage,
                        search: debouncedSearch
                    }
                }),
                api.get(`/finances/stats?doctor_id=${selectedDoctorFilter || 'all'}`),
                api.get('/users/doctors'),
                api.get(`/finances/pending-closures?doctor_id=${selectedDoctorFilter || 'all'}`)
            ]);

            setTransactions(txRes.data.transactions || []);
            setTotalCount(txRes.data.totalCount || 0);
            setStats(statsRes.data || []);
            setDoctors(dRes.data || []);
            setPendingClosures(closuresRes.data || []);
        } catch (err) {
            console.error("Finance fetch error:", err);
            showMessage("Error al cargar datos financieros", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedDoctorFilter, currentPage, itemsPerPage, debouncedSearch, showMessage]);

    useEffect(() => {
        fetchData();
        if (selectedDoctorFilter) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctorFilter);
        }
    }, [fetchData, selectedDoctorFilter, currentPage, debouncedSearch]);

    // --- Calculated / Derived (Now from Server Data) ---
    const calculateBalanceByMethod = (doctorId) => {
        const cashBalance = stats.find(s => s.type === 'cash_balance')?.today || 0;
        const transferBalance = stats.find(s => s.type === 'transfer_balance')?.today || 0;
        return { cash: cashBalance, transfer: transferBalance };
    };

    const calculateBalance = (doctorId) => {
        return stats.find(s => s.type === 'total_net')?.today || 0;
    };

    // --- Handlers ---
    const onSelectDoctor = (id) => {
        setSelectedDoctorFilter(id);
        setCurrentPage(1);
    };

    const handleDeleteTransaction = async (id) => {
        if (!await confirm(t('confirm_delete') || "¿Eliminar transacción?")) return;
        try {
            await api.delete(`/finances/transactions/${id}`);
            showMessage(t('deleted_successfully'), 'success');
            fetchData();
        } catch (err) {
            alert(t('error_deleting'));
        }
    };

    const handleUpdateTransaction = async () => {
        if (!editingTx) return;
        try {
            await api.put(`/finances/transactions/${editingTx.id}`, editingTx);
            showMessage(t('updated_successfully'), 'success');
            setEditingTx(null);
            fetchData();
        } catch (err) {
            alert(t('error_updating'));
        }
    };

    const handleOpenCloseBox = (doctor, balance) => {
        setCloseBoxModal({ open: true, doctorId: doctor.id, doctorName: doctor.full_name, balance });
        setCloseAmount(balance);
    };

    const handleCloseBox = async () => {
        try {
            await api.post('/finances/transactions/close', {
                doctor_id: closeBoxModal.doctorId,
                amount_delivered: closeAmount,
                description: `Entrega de Caja: ${closeBoxModal.doctorName}`
            });
            showMessage(t('box_closed_success'), 'success');
            setCloseBoxModal({ open: false, doctorId: '', doctorName: '', balance: 0 });
            fetchData();
        } catch (err) {
            alert(t('error_closing_box'));
        }
    };

    const handleAutoClosure = async (dayData) => {
        try {
            await api.post('/finances/transactions/close', {
                doctor_id: dayData.doctor_id,
                amount_delivered: dayData.balance,
                description: `Cierre Automático (${dayData.date})`,
                transaction_date: dayData.date
            });
            fetchData();
        } catch (err) {
            showMessage("Error en cierre automático", "error");
        }
    };

    // Placeholder for duplicate logic if needed, simplified for performance
    const duplicateClosures = []; 

    return {
        transactions,
        totalCount,
        currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        stats,
        loading,
        doctors,
        selectedDoctorFilter,
        modalOpen,
        pendingClosuresOpen,
        closeBoxModal,
        closeAmount,
        editingTx,
        pendingClosures,
        duplicateClosures,
        user,
        settings,
        t,
        alert,
        handlers: {
            onSelectDoctor,
            onOpenNewTransaction: () => setModalOpen(true),
            onCloseNewTransaction: () => setModalOpen(false),
            onOpenCloseBox: handleOpenCloseBox,
            onCloseCloseBox: () => setCloseBoxModal({ open: false, doctorId: '', doctorName: '', balance: 0 }),
            onCloseBox: handleCloseBox,
            onRefresh: fetchData,
            onEditTransaction: setEditingTx,
            onUpdateTransaction: handleUpdateTransaction,
            onDeleteTransaction: handleDeleteTransaction,
            setCloseAmount,
            setPendingClosuresOpen,
            setEditingTx,
            handleAutoClosure,
            setSearchQuery,
            onPageChange: setCurrentPage,
            calculateBalanceByMethod,
            calculateBalance
        },
        filters: {
            searchQuery,
            options: { years: [], types: [], paymentMethods: [] } // Simplified filters for now
        },
        filteredTransactions: transactions // Now server-side filtered
    };
};
