import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import { formatPrice } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';
import TransactionModal from '../components/TransactionModal';

const Finances = () => {
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

    const fetchData = async () => {
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
                // Minimizing calls: check if empty? Nah, dashboard might change.
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
    };

    useEffect(() => {
        fetchData();
        localStorage.setItem('last_selected_doctor_id', selectedDoctorFilter);
    }, [selectedDoctorFilter]);

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

    const handleUpdateTransaction = async (e) => {
        if (e) e.preventDefault();
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
            await api.put(`/finance/close-box/${closeBoxModal.doctorId}`);
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

    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
        d = d.replace("Consultation (Booking)", "Consulta (Reserva)");
        d = d.replace("Payment for appointment on", "Pago por turno del");
        d = d.replace("Cash Box Delivery to Dr.", "Entrega de Caja al Dr.");
        d = d.replace("Request: license for", "Solicitud: licencia para");
        d = d.replace("Request: prescription for", "Solicitud: receta para");
        d = d.replace("- Paid", "- Pagado");
        return d;
    };

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">

                {/* Stats (Admin/Secretary) */}
                {(user.role === 'admin' || user.role === 'secretary') && (
                    <div className="stats-grid mb-8">
                        {stats.map((s, idx) => (
                            <div key={idx} className="card text-center">
                                <h3 className="text-sm-muted uppercase">{t(s.type) || s.type.replace('_', ' ')}</h3>
                                <p className="stat-value">${s.total}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className={user.role !== 'patient' ? 'grid-Sidebar-2fr gap-8' : 'grid-1-col'}>

                    {/* Sidebar / Controls for Staff */}
                    {user.role !== 'patient' && (
                        <div className="flex-col gap-8">
                            <div className="card">
                                <h3>{t('actions')}</h3>
                                <button className="btn btn-primary mb-4 w-auto self-start" onClick={() => setModalOpen(true)}>
                                    {t('new_transaction')}
                                </button>

                                <div className="mb-4">
                                    <label className="input-label block font-bold">{t('filter_by_doctor')}</label>
                                    <select className="input-field" value={selectedDoctorFilter} onChange={e => setSelectedDoctorFilter(e.target.value)}>
                                        <option value="">{t('all_doctors')}</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Cash Box Summary (Per Doctor) */}
                            {user.role === 'secretary' && (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3>{t('cash_boxes')}</h3>
                                        {selectedDoctorFilter && (
                                            <button className="btn-text" onClick={() => setSelectedDoctorFilter('')}>
                                                {t('view_all') || 'View All'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid-responsive">
                                        {doctors
                                            .filter(d => !selectedDoctorFilter || d.id == selectedDoctorFilter)
                                            .map(d => {
                                                const bal = calculateBalance(d.id);
                                                return (
                                                    <div key={d.id} className="card item-card p-4 flex flex-col justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-main-800 m-0">{d.full_name}</h4>
                                                            <p className={`text-2xl font-bold mt-2 ${bal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                ${bal.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {(bal > 0 && (user.role === 'admin' || user.role === 'secretary')) && (
                                                            <button
                                                                className="btn btn-sm btn-primary mt-4 w-auto self-start"
                                                                onClick={() => {
                                                                    setCloseBoxModal({ open: true, doctorId: d.id, doctorName: d.full_name, balance: bal });
                                                                    setCloseAmount(bal);
                                                                }}
                                                            >
                                                                {t('deliver')}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Transaction Log */}
                    <div className="card">
                        <h3>{t('transaction_log')}</h3>
                        <table className="table-base table-base-lg w-full">
                            <thead className="bg-slate-50">
                                <tr className="border-b text-left text-xs uppercase tracking-wider text-main-500">
                                    <th className="py-3 px-4">{t('date_label')}</th>
                                    <th className="py-3 px-4 w-1/3">{t('description')}</th>
                                    <th className="py-3 px-4">{t('beneficiary')}</th>
                                    <th className="py-3 px-4">{t('payment_method')}</th>
                                    <th className="py-3 px-4 text-right">{t('amount')}</th>
                                    <th className="py-3 px-4 text-center">{t('proof')}</th>
                                    {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                        <th className="py-3 px-4 text-center">{t('actions')}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Grouping Logic
                                    const groups = [];
                                    let currentGroup = [];
                                    let lastKey = null;

                                    transactions.forEach(tx => {
                                        // Create a unique key for grouping
                                        // Priority: appointment_id -> request_id -> (date + doctor + description)
                                        let key = null;
                                        if (tx.appointment_id) key = `appt_${tx.appointment_id}`;
                                        else if (tx.request_id) key = `req_${tx.request_id}`;
                                        else key = `gen_${tx.transaction_date}_${tx.doctor_id}_${tx.description}`;

                                        if (key !== lastKey) {
                                            if (currentGroup.length > 0) groups.push(currentGroup);
                                            currentGroup = [tx];
                                            lastKey = key;
                                        } else {
                                            currentGroup.push(tx);
                                        }
                                    });
                                    if (currentGroup.length > 0) groups.push(currentGroup);

                                    return groups.map((group, gIdx) => (
                                        <tr key={`group-${gIdx}`} className="hover:bg-slate-50 transition-colors">
                                            {/* Render all rows for this group in a single TR? No, tbody cannot contain nested TRs directly like that cleanly with rowspan usually, but let's try rendering multiple TRs or use a fragment. 
                                               Actually, mapping groups to fragments of TRs is better.
                                             */}
                                            <td colSpan="6" className="p-0 border-b border-slate-100">
                                                {/* Inner table or just rows? If we output TRs here, we need to return an array of elements. React allows returning arrays. */}
                                                <table className="w-full">
                                                    <tbody>
                                                        {group.map((tx, tIdx) => {
                                                            const isDebt = tx.method === 'on_account' || tx.method === 'credit';
                                                            const methodIcon = tx.method === 'cash' ? '💵' : (tx.method === 'transfer' ? '🏦' : (isDebt ? '⏳' : '💳'));
                                                            const methodLabel = tx.method === 'cash' ? t('cash') : (tx.method === 'transfer' ? t('transfer') : (isDebt ? (t('on_account') || 'Cuenta Corriente') : t('card')));
                                                            const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
                                                            // const isExpense = tx.type.includes('expense') || tx.is_withdrawal;
                                                            const isGroupStart = tIdx === 0;
                                                            const isGroupEnd = tIdx === group.length - 1;
                                                            const groupSize = group.length;

                                                            // Visual grouping: If groupSize > 1, add a colored identifying left border or background
                                                            const groupClass = groupSize > 1 ? "bg-amber-50/50" : ""; // light amber background for groups

                                                            return (
                                                                <tr key={tx.id} className={`${groupClass} ${!isGroupEnd ? 'border-b border-amber-100' : ''}`}>
                                                                    <td className="py-3 px-4 text-sm text-main-500 whitespace-nowrap w-[15%]">
                                                                        {new Date(tx.transaction_date).toLocaleDateString()}
                                                                        <div className="text-xs text-muted">{new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </td>
                                                                    <td className="py-3 px-4 w-1/3">
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-xs font-bold uppercase mb-1 w-fit px-2 py-0.5 rounded ${isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {t(tx.type) || tx.type.replace('_', ' ')}
                                                                            </span>
                                                                            <span className="text-sm text-main-700">{translateDescription(tx.description)}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm font-medium text-main-600 w-[15%]">
                                                                        {tx.doctor_name || <span className="text-muted italic">{t('general')}</span>}
                                                                    </td>
                                                                    <td className="py-3 px-4 w-[15%]">
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${tx.method === 'cash' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                            (tx.method === 'transfer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                (isDebt ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'))
                                                                            }`}>
                                                                            <span>{methodIcon}</span> {methodLabel || tx.method}
                                                                        </span>
                                                                    </td>
                                                                    <td className={`py-3 px-4 text-sm font-bold text-right w-[10%] ${tx.is_withdrawal ? 'text-blue-600' : (isIncome ? 'text-green-600' : 'text-red-500')
                                                                        }`}>
                                                                        {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center w-[10%]">
                                                                        {tx.proof_file ? (
                                                                            <a href={tx.proof_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 p-1" title={t('view')}>
                                                                                📁
                                                                            </a>
                                                                        ) : <span className="text-main-300">-</span>}
                                                                    </td>
                                                                    {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                                                        <td className="py-3 px-4 text-center w-[10%]">
                                                                            <div className="flex gap-2 justify-center">
                                                                                <button
                                                                                    className="text-amber-500 hover:text-amber-700 p-1"
                                                                                    onClick={() => setEditingTx(tx)}
                                                                                    title={t('edit')}
                                                                                >
                                                                                    ✏️
                                                                                </button>
                                                                                <button
                                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                                    onClick={() => handleDeleteTransaction(tx.id)}
                                                                                    title={t('delete')}
                                                                                >
                                                                                    🗑️
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                                {/* Group total if > 1 */}
                                                {group.length > 1 && (
                                                    <div className="bg-amber-100/50 px-4 py-1 text-right text-xs font-bold text-amber-800 border-t border-amber-200">
                                                        Total Group: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New Transaction Modal */}
                <TransactionModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        fetchData();
                    }}
                />

                {/* Close Box Modal */}
                <Modal
                    isOpen={closeBoxModal.open}
                    onClose={() => setCloseBoxModal({ ...closeBoxModal, open: false })}
                    title={`${t('close_box')}: ${closeBoxModal.doctorName}`}
                    footer={<><button className="btn btn-primary" onClick={handleCloseBox}>{t('confirm_delivery')}</button></>}
                >
                    <p>{t('current_system_balance')}: <strong>${closeBoxModal.balance?.toFixed(2)}</strong></p>
                    <div className="input-group mt-4">
                        <label className="input-label">{t('amount_delivered')}</label>
                        <CurrencyInput className="input-field" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder={closeBoxModal.balance} />
                    </div>
                    <p className="text-xs-muted">{t('close_box_warning')}</p>
                </Modal>

                {/* Edit Transaction Modal */}
                {editingTx && (
                    <Modal
                        isOpen={!!editingTx}
                        onClose={() => setEditingTx(null)}
                        title={t('edit_transaction') || "Editar Transacción"}
                        footer={
                            <div className="flex gap-2 justify-end w-full">
                                <button className="btn btn-secondary" onClick={() => setEditingTx(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleUpdateTransaction}>{t('save')}</button>
                            </div>
                        }
                    >
                        <form className="space-y-4">
                            <div className="input-group">
                                <label className="input-label">{t('amount')}</label>
                                <CurrencyInput
                                    className="input-field"
                                    value={editingTx.amount}
                                    onChange={e => setEditingTx({ ...editingTx, amount: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('description')}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editingTx.description}
                                    onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('payment_method')}</label>
                                <select
                                    className="input-field"
                                    value={editingTx.method}
                                    onChange={e => setEditingTx({ ...editingTx, method: e.target.value })}
                                >
                                    <option value="cash">{t('cash')}</option>
                                    <option value="transfer">{t('transfer')}</option>
                                    <option value="card">{t('card')}</option>
                                    <option value="on_account">{t('on_account') || 'Cuenta Corriente'}</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('status')}</label>
                                <select
                                    className="input-field"
                                    value={editingTx.status}
                                    onChange={e => setEditingTx({ ...editingTx, status: e.target.value })}
                                >
                                    <option value="paid">{t('paid')}</option>
                                    <option value="pending">{t('pending')}</option>
                                </select>
                            </div>
                        </form>
                    </Modal>
                )}
            </main>
        </div>
    );
};

export default Finances;
