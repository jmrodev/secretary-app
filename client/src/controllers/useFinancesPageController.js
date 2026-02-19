
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

    const handleHistoricalWithdrawal = async (data) => {
        try {
            // Combine date and time
            const dateTime = `${data.date} ${data.time}:00`; // Use space for SQL or T for ISO? Backend uses formatLocalSQL

            await api.post('/finances/transactions', {
                type: 'withdrawal',
                amount: data.amount,
                description: `${data.description} (Cierre Manual)`,
                doctor_id: data.doctor_id,
                transaction_date: dateTime,
                status: 'paid',
                method: 'cash',
                is_withdrawal: true
            });

            // Actually, I should inspect backend createTransaction again.
            // Line 50: INSERT INTO transactions (type, amount... )
            // It does NOT have is_withdrawal in the column list.

            // So if I use createTransaction, is_withdrawal will be 0.
            // And stats query uses `is_withdrawal = 1` for withdrawals.
            // So my historical withdrawal WON'T show as withdrawal in stats!

            // I MUST FIX THE BACKEND TOO.
            // I'll write the frontend code assuming I'll fix the backend to accept 'is_withdrawal' or 'transaction_date' in closeCashBox.
            // I'll use createTransaction and I will update backend to read is_withdrawal from body.

            // Proceed with frontend code.
            showMessage(t('withdrawal_success') || "Retiro registrado exitosamente", 'success');
            setHistoricalWithdrawalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(t('failed_save_withdrawal') || "Error al guardar retiro");
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

    // Calculate Pending Closures (Days with positive cash balance)
    const pendingClosures = useMemo(() => {
        const daysMap = {};

        transactions.forEach(t => {
            if (t.status !== 'paid') return;

            // Extract Date YYYY-MM-DD
            // Handle different date formats if necessary, assuming ISO or SQL
            let dateStr = t.transaction_date;
            if (typeof dateStr === 'string' && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr instanceof Date) {
                dateStr = dateStr.toISOString().split('T')[0];
            } else {
                // Fallback for SQL date string 'YYYY-MM-DD HH:mm:ss'
                dateStr = String(dateStr).split(' ')[0];
            }

            // If it's a Closure, try to use the date from description to match the day correctly
            // (Fixes timezone issues or date mismatch between transaction_date and intended closure date)
            const desc = t.description || '';
            const matchDate = desc.match(/Cierre.*?\((\d{4}-\d{2}-\d{2})\)/);
            if (matchDate && matchDate[1]) {
                // Use the date from description
                dateStr = matchDate[1];
            }

            if (!daysMap[dateStr]) {
                daysMap[dateStr] = {
                    date: dateStr,
                    balance: 0,       // Cash
                    transferBalance: 0, // Transfer
                    lastTime: '00:00',
                    doctor_id: t.doctor_id,
                    doctor_name: t.doctor_name
                };
            }

            const amount = parseFloat(t.amount) || 0;

            // Unambiguous classification using database flags, not fragile string matching
            const isWithdrawal = t.is_withdrawal === 1 || t.is_withdrawal === true || t.type === 'withdrawal';
            const isExpense = String(t.type).startsWith('expense');
            const isIncome = !isWithdrawal && !isExpense;

            if (t.method === 'transfer') {
                if (isWithdrawal || isExpense) {
                    daysMap[dateStr].transferBalance -= amount;
                } else if (isIncome) {
                    daysMap[dateStr].transferBalance += amount;
                }
            } else if (t.method === 'cash') {
                if (isWithdrawal || isExpense) {
                    daysMap[dateStr].balance -= amount;
                } else if (isIncome) {
                    daysMap[dateStr].balance += amount;
                }
            }

            if (isIncome && (t.method === 'cash' || t.method === 'transfer')) {
                // Track last income time
                let timeStr = '00:00';
                if (typeof t.transaction_date === 'string') {
                    if (t.transaction_date.includes('T')) timeStr = t.transaction_date.split('T')[1].substring(0, 5);
                    else if (t.transaction_date.includes(' ')) timeStr = t.transaction_date.split(' ')[1].substring(0, 5);
                } else if (t.transaction_date instanceof Date) {
                    timeStr = t.transaction_date.toTimeString().substring(0, 5);
                }
                if (timeStr > (daysMap[dateStr]?.lastTime || '00:00')) {
                    daysMap[dateStr].lastTime = timeStr;
                }
            }
        });

        // Filter valid pending days (positive balance in EITHER cash or transfer)
        // Also filter out future days or today if not ended? (Policy: End of day closure)
        return Object.values(daysMap)
            .filter(d => (d.balance > 100 || d.transferBalance > 100)) // Threshold to ignore tiny diffs
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [transactions]);

    const handleAutoClosure = async (dayData) => {
        try {
            let [h, m] = dayData.lastTime.split(':').map(Number);
            m += 1; // Add 1 min after last transaction
            if (m >= 60) { h++; m = 0; }
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            const dateTime = `${dayData.date} ${timeStr}`;
            const docId = dayData.doctor_id || doctor_id;

            setLoading(true);
            if (dayData.balance > 0) {
                await api.post('/finances/transactions', {
                    type: 'withdrawal', amount: dayData.balance, description: `Cierre Automático (${dayData.date}) - Efectivo`,
                    doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'cash', is_withdrawal: true
                });
            }
            if (dayData.transferBalance > 0) {
                await api.post('/finances/transactions', {
                    type: 'withdrawal', amount: dayData.transferBalance, description: `Cierre Automático (${dayData.date}) - Transferencia`,
                    doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'transfer', is_withdrawal: true
                });
            }
            showMessage(`Día ${dayData.date} cerrado exitosamente`, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage("Error al procesar el cierre", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAllPending = async () => {
        if (!pendingClosures.length) return;
        if (!await confirm(`¿Está seguro de que desea cerrar las ${pendingClosures.length} cajas pendientes automáticamente?`)) return;

        setLoading(true);
        try {
            for (const day of pendingClosures) {
                // Call handleAutoClosure logic but without individual showMessage
                let [h, m] = day.lastTime.split(':').map(Number);
                m += 1;
                if (m >= 60) { m = 0; h += 1; }
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
                const dateTime = `${day.date} ${timeStr}`;
                const docId = day.doctor_id || doctor_id;

                if (day.balance > 0) {
                    await api.post('/finances/transactions', {
                        type: 'withdrawal', amount: day.balance, description: `Cierre Automático (${day.date}) - Efectivo`,
                        doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'cash', is_withdrawal: true
                    });
                }
                if (day.transferBalance > 0) {
                    await api.post('/finances/transactions', {
                        type: 'withdrawal', amount: day.transferBalance, description: `Cierre Automático (${day.date}) - Transferencia`,
                        doctor_id: docId, transaction_date: dateTime, status: 'paid', method: 'transfer', is_withdrawal: true
                    });
                }
            }
            showMessage(`Se cerraron ${pendingClosures.length} días exitosamente`, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showMessage("Error al cerrar todas las cajas", 'error');
        } finally {
            setLoading(false);
        }
    };



    // ... rest of the hook ... use handlers object to expose it

    // Detect Duplicate Automatic Closures
    const duplicateClosures = useMemo(() => {
        const closuresByDay = {}; // Key: "YYYY-MM-DD_method"
        transactions.forEach(t => {
            // Unambiguous check: it is a closure IF it's a withdrawal AND has no appointment/request ID
            if (t.is_withdrawal && !t.appointment_id && !t.request_id && t.type === 'withdrawal') {
                const desc = t.description || '';
                if (desc.includes('Cierre')) { // Small text check remains only for sub-typing, but key logic is type-based
                    let dateKey = '';
                    const dateMatch = desc.match(/\d{4}-\d{2}-\d{2}/);

                    if (dateMatch) {
                        dateKey = dateMatch[0];
                    } else {
                        if (typeof t.transaction_date === 'string') dateKey = t.transaction_date.split('T')[0];
                        else if (t.transaction_date instanceof Date) dateKey = t.transaction_date.toISOString().split('T')[0];
                    }

                    if (dateKey) {
                        const method = t.method || 'cash';
                        const key = `${dateKey}_${method}`;
                        if (!closuresByDay[key]) closuresByDay[key] = [];
                        closuresByDay[key].push(t);
                    }
                }
            }
        });

        // Return only days/methods with > 1 closure
        return Object.entries(closuresByDay)
            .filter(([_, list]) => list.length > 1)
            .map(([key, list]) => {
                const [date, method] = key.split('_');
                return { date, method, count: list.length, ids: list.map(t => t.id) };
            });
    }, [transactions]);

    const handleFixDuplicates = async () => {
        if (!duplicateClosures.length) return;

        if (!await confirm(`Se encontraron ${duplicateClosures.length} días con cierres duplicados. ¿Desea eliminar los duplicados y dejar solo uno por día?`)) return;

        try {
            let deletedCount = 0;
            for (const day of duplicateClosures) {
                // Sort by ID desc (keep latest)
                const ids = day.ids.sort((a, b) => b - a);
                // Keep the first (latest), delete the rest
                const toDelete = ids.slice(1);

                for (const id of toDelete) {
                    await api.delete(`/finances/transactions/${id}`);
                    deletedCount++;
                }
            }
            showMessage(`Se eliminaron ${deletedCount} cierres duplicados.`, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al eliminar duplicados.");
        }
    };

    const handlers = {
        // ... existing
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
        calculateBalanceByMethod,

        // Historical / Auto
        historicalWithdrawalOpen, // state from previous step
        setHistoricalWithdrawalOpen, // setter from previous step
        handleHistoricalWithdrawal, // handler from previous step

        // Auto Closure
        handleAutoClosure,
        handleCloseAllPending,

        // Duplicates
        handleFixDuplicates,

        // Modal state for Pending Closures
        pendingClosuresOpen,
        setPendingClosuresOpen
    };

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

        // New Props
        pendingClosures,
        duplicateClosures, // New Prop for detection

        // ... other props
        user,
        settings,
        t,
        alert,
        confirm,
        handlers
    };
};
