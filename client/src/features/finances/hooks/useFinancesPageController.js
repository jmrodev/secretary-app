import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';
import { useFinanceHandlers } from './useFinanceHandlers';

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
    const [, setHistoricalWithdrawalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

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
        data: txData, 
        loading: txLoading, 
        refetch: fetchTransactions 
    } = useFetch('/finances/transactions', {
        initialData: { transactions: [], totalCount: 0 },
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
    const { data: doctors = [] } = useFetch('/users/doctors', { initialData: [] });

    // Pending Closures
    const { data: pendingClosures = [], loading: closuresLoading, refetch: fetchClosures } = useFetch(`/finances/pending-closures`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: []
    });

    const transactions = txData?.transactions || [];
    const totalCount = txData?.totalCount || 0;
    const loading = txLoading || statsLoading || closuresLoading || isActionLoading;

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

    const baseHandlers = useFinanceHandlers({
        user, t, showMessage, confirm, alert,
        transactions, pendingClosures, duplicateClosures: [],
        closeBoxModal, closeAmount, editingTx,
        setLoading: setIsActionLoading,
        fetchData, setEditingTx, setModalOpen,
        setHistoricalWithdrawalOpen, setPendingClosuresOpen,
        setCloseBoxModal, setCloseAmount, setSelectedDoctorFilter
    });

    const onSelectDoctor = (id) => {
        setSelectedDoctorFilter(id);
        setCurrentPage(1);
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
            ...baseHandlers,
            onSelectDoctor,
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
