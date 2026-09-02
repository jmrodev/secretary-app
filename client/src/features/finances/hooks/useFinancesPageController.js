import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
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

/**
 * ECC-Pattern: Optimized FinancesPageController
 */
export const useFinancesPageController = ({ itemsPerPage = 14 } = {}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm } = useModal();
    const { settings } = useConfig();

    const [state, dispatch] = useReducer(financesReducer, initialState);
    const { 
        currentPage, debouncedSearch, isActionLoading, modalOpen, 
        pendingClosuresOpen, editingTx, closeBoxModal, closeAmount 
    } = state;

    const { viewDoctorId: selectedDoctorFilter, setViewDoctorId: setSelectedDoctorFilter, doctors, doctorsLoading } = useDoctors();
    const { searchTerm: searchQuery, setSearchTerm: setSearchQuery } = useSearch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_SEARCH', payload: searchQuery });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ECC: Fetch data with envelope support
    const { 
        data: txResponse, 
        loading: txLoading, 
        refetch: fetchTransactions 
    } = useFetch('/finances/transactions', {
        initialData: { success: true, data: { transactions: [], totalCount: 0 } },
        params: {
            doctor_id: selectedDoctorFilter || 'all',
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch
        }
    });

    const { data: statsResponse, refetch: fetchStats } = useFetch(`/finances/stats`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: { success: true, data: [] }
    });

    const { data: closuresResponse, refetch: fetchClosures } = useFetch(`/finances/pending-closures`, {
        params: { doctor_id: selectedDoctorFilter || 'all' },
        initialData: { success: true, data: [] }
    });

    // ECC: Unpack data
    const txData = txResponse?.data || {};
    const transactions = txData.transactions || [];
    const totalCount = txData.totalCount || 0;
    const stats = statsResponse?.data?.stats || statsResponse?.data || [];
    const totalDebt = statsResponse?.data?.totalDebt || 0;
    const rentalDebt = statsResponse?.data?.rentalDebt || 0;
    const pendingClosures = closuresResponse?.data || [];

    const loading = txLoading || doctorsLoading || isActionLoading;
    const fetched = txResponse !== undefined && !txLoading;


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
        totalDebt,
        rentalDebt,
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
