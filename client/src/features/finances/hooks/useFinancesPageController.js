import { useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';
import { useFinanceHandlers } from '@/features/finances/hooks/useFinanceHandlers';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useSearch } from '@/hooks/useSearch';

const initialState = {
    currentPage: 1,
    debouncedSearch: '',
    isActionLoading: false,
    modalOpen: false,
    pendingClosuresOpen: false,
    editingTx: null,
    closeBoxModal: { open: false, doctorId: '', doctorName: '', balance: 0 },
    closeAmount: ''
};

function financesReducer(state, action) {
    switch (action.type) {
        case 'SET_PAGE': return { ...state, currentPage: action.payload };
        case 'SET_SEARCH': return { ...state, debouncedSearch: action.payload, currentPage: 1 };
        case 'SET_LOADING': return { ...state, isActionLoading: action.payload };
        case 'SET_MODAL_OPEN': return { ...state, modalOpen: action.payload };
        case 'SET_CLOSURES_OPEN': return { ...state, pendingClosuresOpen: action.payload };
        case 'SET_EDITING_TX': return { ...state, editingTx: action.payload };
        case 'SET_CLOSE_BOX': return { ...state, closeBoxModal: { ...state.closeBoxModal, ...action.payload } };
        case 'SET_CLOSE_AMOUNT': return { ...state, closeAmount: action.payload };
        default: return state;
    }
}

export const useFinancesPageController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm } = useModal();
    const { settings } = useConfig();

    // --- State Management ---
    const [state, dispatch] = useReducer(financesReducer, initialState);
    const { 
        currentPage, debouncedSearch, isActionLoading, modalOpen, 
        pendingClosuresOpen, editingTx, closeBoxModal, closeAmount 
    } = state;

    const itemsPerPage = 50;
    const { viewDoctorId: selectedDoctorFilter, setViewDoctorId: setSelectedDoctorFilter, doctors, doctorsLoading } = useDoctors();
    const { searchTerm: searchQuery, setSearchTerm: setSearchQuery } = useSearch();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_SEARCH', payload: searchQuery });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
    const { data: stats = [], refetch: fetchStats } = useFetch(`/finances/stats`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: []
    });

    // Pending Closures
    const { data: pendingClosures = [], refetch: fetchClosures } = useFetch(`/finances/pending-closures`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: []
    });

    const transactions = txData?.transactions || [];
    const totalCount = txData?.totalCount || 0;
    const loading = txLoading || doctorsLoading || isActionLoading;
    const fetched = txData !== undefined && !txLoading;

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
        setLoading: (val) => dispatch({ type: 'SET_LOADING', payload: val }),
        fetchData, 
        setEditingTx: (val) => dispatch({ type: 'SET_EDITING_TX', payload: val }), 
        setModalOpen: (val) => dispatch({ type: 'SET_MODAL_OPEN', payload: val }),
        setHistoricalWithdrawalOpen: () => {}, // Handled elsewhere or not needed
        setPendingClosuresOpen: (val) => dispatch({ type: 'SET_CLOSURES_OPEN', payload: val }),
        setCloseBoxModal: (val) => dispatch({ type: 'SET_CLOSE_BOX', payload: val }), 
        setCloseAmount: (val) => dispatch({ type: 'SET_CLOSE_AMOUNT', payload: val }), 
        setSelectedDoctorFilter
    });

    const onSelectDoctor = (id) => {
        setSelectedDoctorFilter(id);
        dispatch({ type: 'SET_PAGE', payload: 1 });
    };

    const calculateBalanceByMethod = (_doctorId) => {
        const cashBalance = stats.find(s => s.type === 'cash_balance')?.today || 0;
        const transferBalance = stats.find(s => s.type === 'transfer_balance')?.today || 0;
        return { cash: cashBalance, transfer: transferBalance };
    };

    const calculateBalance = (_doctorId) => {
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
            onPageChange: (page) => dispatch({ type: 'SET_PAGE', payload: page }),
            calculateBalanceByMethod,
            calculateBalance
        },
        filters: {
            searchQuery,
            options: { years: [], types: [], paymentMethods: [] }
        },
        filteredTransactions: transactions,
        fetched
    };

};
