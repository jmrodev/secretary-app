import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
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
                if (t.type.includes('expense')) return acc - parseFloat(t.amount); // General expense usually handled differently but let's assume (-)
                return acc;
            }, 0);
    };

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <h1 className="title">{t('finances')}</h1>

                {/* Stats (Admin/Secretary) */}
                {(user.role === 'admin' || user.role === 'secretary') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {stats.map((s, idx) => (
                            <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase' }}>{t(s.type) || s.type.replace('_', ' ')}</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>${s.total}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: user.role !== 'patient' ? '1fr 2fr' : '1fr', gap: '2rem' }}>

                    {/* Sidebar / Controls for Staff */}
                    {user.role !== 'patient' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card">
                                <h3>{t('actions')}</h3>
                                <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setModalOpen(true)}>
                                    {t('new_transaction')}
                                </button>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{t('filter_by_doctor')}</label>
                                    <select className="input-field" value={selectedDoctorFilter} onChange={e => setSelectedDoctorFilter(e.target.value)}>
                                        <option value="">{t('all_doctors')}</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Cash Box Summary (Per Doctor) */}
                            {user.role === 'secretary' && (
                                <div className="card">
                                    <h3>{t('cash_boxes')}</h3>
                                    {doctors.map(d => {
                                        const bal = calculateBalance(d.id);
                                        return (
                                            <div key={d.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{d.full_name}</div>
                                                    <div style={{ fontSize: '1.2rem', color: bal >= 0 ? 'green' : 'red' }}>${bal.toFixed(2)}</div>
                                                </div>
                                                {bal > 0 && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
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
                            )}
                        </div>
                    )}

                    {/* Transaction Log */}
                    <div className="card">
                        <h3>{t('transaction_log')}</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem' }}>{t('date_label')}</th>
                                    <th style={{ padding: '1rem' }}>{t('description')}</th>
                                    <th style={{ padding: '1rem' }}>{t('beneficiary')}</th>
                                    <th style={{ padding: '1rem' }}>{t('payment_method')}</th>
                                    <th style={{ padding: '1rem' }}>{t('amount')}</th>
                                    <th style={{ padding: '1rem' }}>{t('proof')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{t.type.replace('_', ' ').toUpperCase()}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.description}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{t.doctor_name || t('general')}</td>
                                        <td style={{ padding: '1rem' }}>{t.method}</td>
                                        <td style={{ padding: '1rem', color: t.is_withdrawal ? 'blue' : (t.type.includes('income') ? 'green' : 'red'), fontWeight: 'bold' }}>
                                            {t.is_withdrawal ? '↩' : (t.type.includes('income') ? '+' : '-')}${Math.abs(t.amount)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {t.proof_file ? <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${t.proof_file}`} target="_blank" rel="noreferrer">{t('view') || 'View'}</a> : '-'}
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
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">{t('amount_delivered')}</label>
                        <input type="number" className="input-field" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder={closeBoxModal.balance} />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>{t('close_box_warning')}</p>
                </Modal>
            </main>
        </div>
    );
};

export default Finances;
