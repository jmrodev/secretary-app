import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import { formatPrice } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';
import TransactionModal from '../components/TransactionModal';

const Finances = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lists
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // Filters
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');

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
    }, [selectedDoctorFilter]);

    const handleCloseBox = async () => {
        try {
            await api.post('/finances/transactions/close', {
                doctor_id: closeBoxModal.doctorId,
                amount_delivered: closeAmount,
                description: `Cash Box Delivery to Dr. ${closeBoxModal.doctorName}`
            });
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
                <h1 className="title">{t('finances')}</h1>

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
                                                            <h4 className="font-bold text-slate-800 m-0">{d.full_name}</h4>
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
                        <table className="transactions-table">
                            <thead>
                                <tr className="text-left border-b-slate">
                                    <th className="p-4">{t('date_label')}</th>
                                    <th className="p-4">{t('description')}</th>
                                    <th className="p-4">{t('beneficiary')}</th>
                                    <th className="p-4">{t('payment_method')}</th>
                                    <th className="p-4">{t('amount')}</th>
                                    <th className="p-4">{t('proof')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="border-b-divider">
                                        <td className="p-4">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div>{t(tx.type) || tx.type.replace('_', ' ').toUpperCase()}</div>
                                            <div className="text-sm-muted">{translateDescription(tx.description)}</div>
                                        </td>
                                        <td className="p-4">{tx.doctor_name || t('general')}</td>
                                        <td className="p-4">{tx.method}</td>
                                        <td className={`p-4 font-bold ${tx.is_withdrawal ? 'text-blue-600' : (tx.type.includes('income') ? 'text-green-600' : 'text-red-500')}`}>
                                            {tx.is_withdrawal ? '↩' : (tx.type.includes('income') ? '+' : '-')}${Math.abs(tx.amount)}
                                        </td>
                                        <td className="p-4">
                                            {tx.proof_file ? <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${tx.proof_file}`} target="_blank" rel="noreferrer">{t('view') || 'View'}</a> : '-'}
                                        </td>
                                    </tr>
                                ))}
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
            </main>
        </div>
    );
};

export default Finances;
