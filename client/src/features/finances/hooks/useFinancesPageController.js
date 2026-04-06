import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/api/axios';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

export const useFinancesPageController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm } = useModal();
    const { settings } = useConfig();

    // --- View State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Save filter preference
    useEffect(() => {
        if (selectedDoctorFilter) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctorFilter);
        }
    }, [selectedDoctorFilter]);

    // --- FETCH DATA using useFetch ---
    
    // Transactions
    const { 
        data: txData = { transactions: [], totalCount: 0 }, 
        loading: txLoading, 
        refetch: fetchTransactions 
    } = useFetch('/finances/transactions', {
        params: {
            doctor_id: selectedDoctorFilter || 'all',
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch
        }
    });

    // Stats
    const { data: stats = [], loading: statsLoading, refetch: fetchStats } = useFetch(`/finances/stats`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: []
    });

    // Doctors
    const { data: doctors = [], loading: doctorsLoading } = useFetch('/users/doctors', { initialData: [] });

    // Pending Closures
    const { data: pendingClosures = [], loading: closuresLoading, refetch: fetchClosures } = useFetch(`/finances/pending-closures`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: []
    });

    const transactions = txData.transactions || [];
    const totalCount = txData.totalCount || 0;
    const loading = txLoading || statsLoading || closuresLoading;

    // --- UI State ---
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingClosuresOpen, setPendingClosuresOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [closeBoxModal, setCloseBoxModal] = useState({ open: false, doctorId: '', doctorName: '', balance: 0 });
    const [closeAmount, setCloseAmount] = useState('');

    // --- Handlers ---
    const fetchData = useCallback(() => {
        fetchTransactions();
        fetchStats();
        fetchClosures();
    }, [fetchTransactions, fetchStats, fetchClosures]);

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

    const calculateBalanceByMethod = (doctorId) => {
        const cashBalance = stats.find(s => s.type === 'cash_balance')?.today || 0;
        const transferBalance = stats.find(s => s.type === 'transfer_balance')?.today || 0;
        return { cash: cashBalance, transfer: transferBalance };
    };

    const calculateBalance = (doctorId) => {
        return stats.find(s => s.type === 'total_net')?.today || 0;
    };

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
        duplicateClosures: [],
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
            options: { years: [], types: [], paymentMethods: [] }
        },
        filteredTransactions: transactions
    };
};

