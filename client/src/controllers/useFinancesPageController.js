
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../features/auth';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import { useFinanceHandlers } from '../hooks/useFinanceHandlers';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

    // New Transaction Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [historicalWithdrawalOpen, setHistoricalWithdrawalOpen] = useState(false);
    const [pendingClosuresOpen, setPendingClosuresOpen] = useState(false);

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
            } else {
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




    // ... rest of the hook ... use handlers object to expose it

    // Detect Pending Closures (Days with transactions but no closure record)
    const pendingClosures = useMemo(() => {
        const closuresByDay = new Set();
        const transByDay = {}; // { "YYYY-MM-DD_docId": summary }

        transactions.forEach(t => {
            // Priority 1: Date in description "(YYYY-MM-DD)"
            // Priority 2: transaction_date field
            const desc = t.description || '';
            const dateInDesc = desc.match(/\d{4}-\d{2}-\d{2}/);
            const dateKey = dateInDesc ? dateInDesc[0] : (t.transaction_date ? String(t.transaction_date).split(' ')[0].split('T')[0] : '');

            if (!dateKey) return;
            const docId = t.doctor_id || 'null';
            const key = `${dateKey}_${docId}`;

            // Check if it's a closure withdrawal to avoid prompting again unless balance is > 0
            if (t.is_withdrawal && t.type === 'withdrawal' && desc.includes('Cierre')) {
                const method = t.method || 'cash';
                closuresByDay.add(`${key}_${method}`);
            }

            // Consider all paid transactions to compute the remaining balance accurately
            if (t.status === 'paid') {
                if (!transByDay[key]) {
                    const doc = doctors.find(d => String(d.id) === String(docId));
                    transByDay[key] = {
                        date: dateKey,
                        doctor_id: docId,
                        doctor_name: doc ? doc.full_name : (docId === 'null' ? 'Sin Doctor' : `Doc ${docId}`),
                        balance: 0,
                        transferBalance: 0,
                        lastTime: '20:00' // Fallback
                    };
                }

                const amount = parseFloat(t.amount) || 0;
                const isIncome = t.type.includes('income');
                const isExpense = t.type.includes('expense');
                const isWithdrawal = t.is_withdrawal;

                let delta = 0;
                if (isWithdrawal) delta = -amount;
                else if (isIncome) delta = amount;
                else if (isExpense) delta = -amount;

                if (t.method === 'cash') transByDay[key].balance += delta;
                else if (t.method !== 'cash') transByDay[key].transferBalance += delta;

                // Update last time if available (only if it matches the current date key, to avoid mixing times from different days)
                if (!isWithdrawal && t.transaction_date && String(t.transaction_date).startsWith(dateKey)) {
                    const time = String(t.transaction_date).includes('T') ? t.transaction_date.split('T')[1]?.slice(0, 5) : t.transaction_date.split(' ')[1]?.slice(0, 5);
                    if (time && time > transByDay[key].lastTime) transByDay[key].lastTime = time;
                }
            }
        });

        // Map into a list and filter out already closed ones
        const pending = [];
        Object.entries(transByDay).forEach(([dayDocKey, summary]) => {
            // Only suggest closure if there is more than 0.01 remaining
            const needsCashClose = summary.balance > 0.01 && !closuresByDay.has(`${dayDocKey}_cash`);
            const needsTransferClose = summary.transferBalance > 0.01 && !closuresByDay.has(`${dayDocKey}_transfer`);

            if (needsCashClose || needsTransferClose) {
                pending.push({
                    ...summary,
                    balance: needsCashClose ? summary.balance : 0,
                    transferBalance: needsTransferClose ? summary.transferBalance : 0
                });
            }
        });

        return pending.sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, doctors]);

    // Detect Duplicate Automatic Closures
    const duplicateClosures = useMemo(() => {
        const closuresByDay = {}; // Key: "YYYY-MM-DD_method_doctor"
        transactions.forEach(t => {
            if (t.is_withdrawal && !t.appointment_id && !t.request_id && t.type === 'withdrawal') {
                const desc = t.description || '';
                if (desc.includes('Cierre')) {
                    const dateMatch = desc.match(/\d{4}-\d{2}-\d{2}/);
                    const dateKey = dateMatch ? dateMatch[0] : (t.transaction_date ? String(t.transaction_date).split(' ')[0].split('T')[0] : '');

                    if (dateKey) {
                        const method = t.method || 'cash';
                        const docId = t.doctor_id || 'null';
                        const key = `${dateKey}_${method}_${docId}`;
                        if (!closuresByDay[key]) closuresByDay[key] = [];
                        closuresByDay[key].push(t);
                    }
                }
            }
        });

        return Object.entries(closuresByDay)
            .filter(([_, list]) => list.length > 1)
            .map(([key, list]) => {
                const [date, method, docId] = key.split('_');
                return { date, method, doctor_id: docId, count: list.length, ids: list.map(t => t.id) };
            });
    }, [transactions]);

    /**
     * Frontend Filtered Transactions
     */
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesPatient = tx.patient_full_name?.toLowerCase().includes(query);
                const matchesDesc = tx.description?.toLowerCase().includes(query);
                const matchesAmount = tx.amount?.toString().includes(query);
                const matchesStatus = t(tx.status)?.toLowerCase().includes(query);
                const matchesMethod = t(tx.method)?.toLowerCase().includes(query);

                if (!matchesPatient && !matchesDesc && !matchesAmount && !matchesStatus && !matchesMethod) return false;
            }

            // Status Filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'bonified') {
                    const isBonified = tx.bonified === 1 || tx.payment_status === 'bonified';
                    if (!isBonified) return false;
                } else if (tx.status !== statusFilter) {
                    return false;
                }
            }

            // Type Filter
            if (typeFilter !== 'all') {
                const txType = tx.appointment_id ? 'appointment' : tx.request_type ? 'request' : tx.type;
                if (typeFilter === 'appointment' && !tx.appointment_id) return false;
                if (typeFilter === 'request' && !tx.request_type) return false;
                if (typeFilter !== 'appointment' && typeFilter !== 'request' && tx.type !== typeFilter) return false;
            }

            // Payment Method Filter
            if (paymentMethodFilter !== 'all' && tx.method !== paymentMethodFilter) return false;

            // Date Filters
            if (monthFilter !== 'all' || yearFilter !== 'all') {
                const date = new Date(tx.transaction_date);
                if (monthFilter !== 'all' && (date.getMonth() + 1).toString() !== monthFilter) return false;
                if (yearFilter !== 'all' && date.getFullYear().toString() !== yearFilter) return false;
            }

            return true;
        });
    }, [transactions, searchQuery, statusFilter, typeFilter, monthFilter, yearFilter, paymentMethodFilter]);

    // Available filters generator
    const filterOptions = useMemo(() => {
        const years = new Set();
        const types = new Set();
        const paymentMethods = new Set();
        transactions.forEach(tx => {
            if (tx.transaction_date) {
                years.add(new Date(tx.transaction_date).getFullYear().toString());
            }
            if (tx.appointment_id) types.add('appointment');
            else if (tx.request_type) types.add('request');
            else types.add(tx.type);
            if (tx.method) paymentMethods.add(tx.method);
        });

        return {
            years: Array.from(years).sort((a, b) => b - a),
            types: Array.from(types),
            paymentMethods: Array.from(paymentMethods)
        };
    }, [transactions]);

    // Initialize Handlers
    const financeHandlers = useFinanceHandlers({
        user, t, showMessage, confirm, alert,
        transactions, pendingClosures, duplicateClosures,
        closeBoxModal, closeAmount, editingTx,
        setLoading, fetchData, setEditingTx, setModalOpen,
        setHistoricalWithdrawalOpen, setPendingClosuresOpen,
        setCloseBoxModal, setCloseAmount, setSelectedDoctorFilter
    });

    return {
        // State
        transactions,
        stats,
        loading,
        doctors,
        patients,
        selectedDoctorFilter,
        modalOpen,
        historicalWithdrawalOpen,
        pendingClosuresOpen,
        closeBoxModal,
        closeAmount,
        editingTx,

        // Derived
        pendingClosures,
        duplicateClosures,
        calculateBalance,
        calculateBalanceByMethod,

        // Meta
        user,
        settings,
        t,
        alert,
        confirm,

        // Final Handlers
        handlers: {
            ...financeHandlers,
            calculateBalance,
            calculateBalanceByMethod,
            setSearchQuery,
            setStatusFilter,
            setTypeFilter,
            setMonthFilter,
            setYearFilter,
            setPaymentMethodFilter
        },

        // Filter State
        filters: {
            searchQuery,
            statusFilter,
            typeFilter,
            monthFilter,
            yearFilter,
            paymentMethodFilter,
            options: filterOptions
        },
        filteredTransactions
    };
};
