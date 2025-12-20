import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';

const Finances = () => {
    const { user } = useAuth();
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
            // Fetch Transactions
            const res = await api.get(`/finances?doctor_id=${selectedDoctorFilter}`);
            setTransactions(res.data);

            // Fetch Stats/Balance (Simplified for now, just sum locally or fetch stats specific to view)
            // Ideally backend gives us a "Balance" endpoint per doctor. 
            // For now, let's rely on transaction list calc or existing stats.

            if (user.role === 'secretary' || user.role === 'admin') {
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
            await api.post('/finances/close-box', {
                doctor_id: closeBoxModal.doctorId,
                amount_delivered: closeAmount,
                description: `Cash Box Delivery to Dr. ${closeBoxModal.doctorName}`
            });
            setCloseBoxModal({ ...closeBoxModal, open: false });
            setCloseAmount('');
            fetchData();
        } catch (err) {
            alert("Failed to close box");
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    {(user.role === 'secretary' || user.role === 'admin') && <a href="/appointments" className="sidebar-link">Appointments</a>}
                    <a href="#" className="sidebar-link active">Finances</a>
                </nav>
            </aside>
            <main className="main-content">
                <h1 className="title">Finances</h1>

                {/* Stats (Admin/Secretary) */}
                {(user.role === 'admin' || user.role === 'secretary') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {stats.map((s, idx) => (
                            <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase' }}>{s.type.replace('_', ' ')}</h3>
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
                                <h3>Actions</h3>
                                <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setModalOpen(true)}>
                                    + New Transaction
                                </button>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Filter by Doctor</label>
                                    <select className="input-field" value={selectedDoctorFilter} onChange={e => setSelectedDoctorFilter(e.target.value)}>
                                        <option value="">All Doctors</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Cash Box Summary (Per Doctor) */}
                            {user.role === 'secretary' && (
                                <div className="card">
                                    <h3>Cash Boxes</h3>
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
                                                        Deliver
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
                        <h3>Transaction Log</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Description</th>
                                    <th style={{ padding: '1rem' }}>Beneficiary</th>
                                    <th style={{ padding: '1rem' }}>Method</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                    <th style={{ padding: '1rem' }}>Proof</th>
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
                                        <td style={{ padding: '1rem' }}>{t.doctor_name || 'General'}</td>
                                        <td style={{ padding: '1rem' }}>{t.method}</td>
                                        <td style={{ padding: '1rem', color: t.is_withdrawal ? 'blue' : (t.type.includes('income') ? 'green' : 'red'), fontWeight: 'bold' }}>
                                            {t.is_withdrawal ? '↩' : (t.type.includes('income') ? '+' : '-')}${Math.abs(t.amount)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {t.proof_file ? <a href={`http://localhost:5000${t.proof_file}`} target="_blank" rel="noreferrer">View</a> : '-'}
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
                    title={`Close Box: ${closeBoxModal.doctorName}`}
                    footer={<><button className="btn btn-primary" onClick={handleCloseBox}>Confirm Delivery</button></>}
                >
                    <p>Current System Balance: <strong>${closeBoxModal.balance?.toFixed(2)}</strong></p>
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Amount Delivered to Doctor</label>
                        <input type="number" className="input-field" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder={closeBoxModal.balance} />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>This will create a withdrawal record and reset the cash count.</p>
                </Modal>
            </main>
        </div>
    );
};

export default Finances;
