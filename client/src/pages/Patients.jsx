import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';

import Modal from '../components/Modal';

const Patients = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // View Details State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [details, setDetails] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    // Creation Form State
    const [showCreate, setShowCreate] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [newDni, setNewDni] = useState('');
    const [newInsurance, setNewInsurance] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [createMsg, setCreateMsg] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

    // Debt Payment Modal State
    const [debtModalOpen, setDebtModalOpen] = useState(false);
    const [debtParams, setDebtParams] = useState({ patientId: null, amount: '', method: 'cash' });

    const fetchPatients = async () => {
        try {
            const res = await api.get('/users/patients');
            setPatients(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('failed_create_patient'), 'error'); // Reusing error msg slightly
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const normalizeText = (text) => {
        if (!text) return "";
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const calculateFinancialRating = (debt) => {
        if (debt <= 0) return 5;
        if (debt < 1000) return 4;
        if (debt < 5000) return 3;
        if (debt < 10000) return 2;
        return 1;
    };

    const calculateAttendanceRating = (total, missed) => {
        if (!total || total === 0) return 5; // New patient
        const ratio = (total - missed) / total;
        if (ratio >= 0.95) return 5;
        if (ratio >= 0.85) return 4;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.50) return 2;
        return 1;
    };

    const handleBehaviorRatingChange = async (patientId, newRating) => {
        try {
            await api.put(`/users/patients/${patientId}`, { behavior_rating: newRating });
            // Optimistic update
            setPatients(prev => prev.map(p =>
                p.id === patientId ? { ...p, behavior_rating: newRating } : p
            ));
        } catch (err) {
            console.error("Failed to update behavior rating", err);
        }
    };

    const filteredPatients = patients.filter(p =>
        normalizeText(p.full_name).includes(normalizeText(searchTerm)) ||
        (p.phone && p.phone.includes(searchTerm)) ||
        (p.dni && p.dni.includes(searchTerm)) ||
        (p.insurance && normalizeText(p.insurance).includes(normalizeText(searchTerm))) ||
        (p.email && normalizeText(p.email).includes(normalizeText(searchTerm)))
    ).sort((a, b) => {
        // Sort by debt descending (debtors first)
        const debtA = Number(a.total_debt) || 0;
        const debtB = Number(b.total_debt) || 0;
        if (debtA > 0 && debtB === 0) return -1;
        if (debtA === 0 && debtB > 0) return 1;
        if (debtA > 0 && debtB > 0) return debtB - debtA; // Higher debt first
        // Secondary sort by name
        return a.full_name.localeCompare(b.full_name);
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateMsg('');
        try {
            await api.post('/auth/register', {
                username: newUsername,
                password: newPassword,
                role: 'patient',
                fullName,
                phone,
                dob,
                dni: newDni,
                insurance: newInsurance,
                email: newEmail
            });
            showMessage(t('patient_created'), 'success');
            setShowCreate(false);
            setNewUsername('');
            setNewPassword('');
            setFullName('');
            setPhone('');
            setDob('');

            setNewDni('');
            setNewInsurance('');
            setNewEmail('');
            fetchPatients();
        } catch (err) {
            const msg = err.response?.data || t('failed_create_patient');
            setCreateMsg(msg); // Keep local msg for form error
            showMessage(msg, 'error');
            console.error(err);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            setViewLoading(true);
            setSelectedPatient(id);
            setDetails(null);
            const [info, trans] = await Promise.all([
                api.get(`/users/patients/${id}`),
                api.get(`/finances/transactions?patient_id=${id}`) // Fetch financial history
            ]);
            setDetails({ ...info.data, transactions: trans.data });
        } catch (err) {
            console.error("Failed to view details", err);
            showMessage("Failed to load patient history", 'error');
            setSelectedPatient(null);
        } finally {
            setViewLoading(false);
        }
    };

    const handleEditClick = () => {
        setEditData({
            full_name: details.full_name || '',
            dni: details.dni || '',
            phone: details.phone || '',
            insurance: details.insurance || '',
            email: details.email || '',
            dob: details.dob ? details.dob.split('T')[0] : '',

            medical_history: details.medical_history || '',
            tariff_percent: details.tariff_percent || 0,
            tariff_override: details.tariff_override || ''
        });
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/users/patients/${details.id}`, editData); // details.id is patients.id
            setEditModalOpen(false);
            showMessage(t('patient_updated'), 'success');
            // Refresh details
            handleViewDetails(details.id);
            // Also refresh list if needed, but prioritize view
            fetchPatients();
        } catch (err) {
            console.error("Failed to update patient", err);
            showMessage(t('failed_update_patient'), 'error');
        }
    };

    // Debt Payment Handlers
    const openDebtModal = (e, patientId, currentDebt) => {
        e.stopPropagation();
        setDebtParams({ patientId, amount: currentDebt, method: 'cash' });
        setDebtModalOpen(true);
    };

    const handlePayDebt = async () => {
        try {
            await api.post('/finances/pay-debt', {
                patient_id: debtParams.patientId,
                amount: debtParams.amount,
                method: debtParams.method
            });
            showMessage(t('payment_processed'), 'success');
            setDebtModalOpen(false);
            fetchPatients(); // Refresh list to update badge
            if (selectedPatient === debtParams.patientId) {
                handleViewDetails(selectedPatient); // Refresh details if open
            }
        } catch (err) {
            console.error(err);
            showMessage(t('payment_failed'), 'error');
        }
    };

    if (loading) return <div>{t('loading')}</div>;

    if (viewLoading) {
        return (
            <div className="app-layout">
                <aside className="sidebar">
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                    </div>
                </aside>
                <main className="main-content">
                    <div>{t('loading')}</div>
                </main>
            </div>
        );
    }

    if (selectedPatient && details) {
        return (
            <div className="app-layout">
                <aside className="sidebar">
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                    </div>
                    <nav>
                        <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                        <a href="#" className="sidebar-link active">{t('patients')}</a>
                    </nav>
                </aside>
                <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <button onClick={() => { setSelectedPatient(null); setDetails(null); }} style={{ marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 'bold' }}>&larr; {t('back_to_list')}</button>

                    <h1 className="title" style={{ textTransform: 'capitalize' }}>{details.full_name}</h1>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>{t('patient_info')}</h3>
                            <button className="btn btn-secondary" onClick={handleEditClick} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>{t('edit_info')}</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <p><strong>{t('dni')}:</strong> {details.dni || 'N/A'}</p>
                            <p><strong>Insurance:</strong> {details.insurance || 'N/A'}</p>
                            <p><strong>Phone:</strong> {details.phone ? <a href={`https://wa.me/${details.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold' }}>{details.phone}</a> : 'N/A'}</p>
                            <p><strong>Email:</strong> {details.email ? <a href={`mailto:${details.email}`} style={{ color: '#3b82f6', fontWeight: 'bold' }}>{details.email}</a> : 'N/A'}</p>
                            <p><strong>{t('dob')}:</strong> {details.dob ? new Date(details.dob).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
                            <p><strong>{t('address')}:</strong> {details.address || 'N/A'}</p>
                            <p><strong>{t('accumulated_medical_leave')}:</strong> <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{details.accumulated_days || 0} Days</span></p>
                        </div>
                        <p style={{ marginTop: '0.5rem' }}><strong>{t('micro_history')}:</strong> {details.medical_history || 'N/A'}</p>
                    </div>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>{t('previous_appointments')}</h3>
                        {details.appointments.length === 0 ? <p>{t('no_appointments')}</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {details.appointments.map(a => (
                                    <li key={a.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        {new Date(a.appointment_date).toLocaleDateString()} - <strong>Dr. {a.doctor_name}</strong>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{a.reason}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>{t('medical_documents')}</h3>

                        <h4 style={{ fontSize: '1rem', marginTop: '1rem', color: '#64748b' }}>{t('prescriptions_licenses')}</h4>
                        {details.prescriptions && details.prescriptions.length === 0 ? <p className="text-muted">None.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {details.prescriptions && details.prescriptions.map(p => (
                                    <li key={p.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        {new Date(p.created_at).toLocaleDateString()} - <strong>{(p.type || 'unknown').toUpperCase()}</strong> by Dr. {p.doctor_name}
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{p.diagnosis ? `Dx: ${p.diagnosis}` : `Days: ${p.days}`}</div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <h4 style={{ fontSize: '1rem', marginTop: '1.5rem', color: '#64748b' }}>Uploaded Files</h4>
                        {details.files && details.files.length === 0 ? <p className="text-muted">No uploaded files.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {details.files && details.files.map(f => (
                                    <li key={f.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${f.file_url}`} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', color: '#3b82f6', textDecoration: 'none' }}>
                                                {f.description || f.file_name}
                                            </a>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                Uploaded by {f.uploader_name} on {new Date(f.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>{t('financial_history_debt')}</h3>
                        {(!details.transactions || details.transactions.length === 0) ? <p>No transactions found.</p> : (
                            <>
                                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{t('total_debt')}: </strong>
                                        <span style={{ color: '#b45309', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            ${details.transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {details.transactions.some(t => t.status === 'pending') && (
                                        <button className="btn btn-primary" onClick={(e) => openDebtModal(e, details.id, details.transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0))}>{t('pay_debt')}</button>
                                    )}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.5rem' }}>{t('transaction_date')}</th>
                                            <th style={{ padding: '0.5rem' }}>{t('description')}</th>
                                            <th style={{ padding: '0.5rem' }}>{t('amount')}</th>
                                            <th style={{ padding: '0.5rem' }}>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.transactions.map(tx => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.5rem' }}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.5rem' }}>{tx.description}</td>
                                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>${tx.amount}</td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px',
                                                        background: tx.status === 'paid' ? '#dcfce7' : '#fee2e2',
                                                        color: tx.status === 'paid' ? '#166534' : '#991b1b',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {(tx.status === 'paid' ? t('paid') : t('debt')).toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>

                    <Modal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        title="Edit Patient Details"
                        footer={
                            <>
                                <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleSaveEdit}>{t('confirm')}</button>
                            </>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">{t('full_name')}</label>
                                <input className="input-field" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">{t('dni')}</label>
                                    <input className="input-field" value={editData.dni} onChange={e => setEditData({ ...editData, dni: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Insurance</label>
                                    <input className="input-field" value={editData.insurance} onChange={e => setEditData({ ...editData, insurance: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input className="input-field" type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <input className="input-field" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('dob')}</label>
                                    <input type="date" className="input-field" value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('address')}</label>
                                <input className="input-field" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('micro_history')}</label>
                                <textarea className="input-field" rows="3" value={editData.medical_history} onChange={e => setEditData({ ...editData, medical_history: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Tariff Adjustment (%)</label>
                                    <input type="number" className="input-field" value={editData.tariff_percent} onChange={e => setEditData({ ...editData, tariff_percent: e.target.value })} placeholder="e.g. 10 for +10%" />
                                    <small style={{ color: '#64748b' }}>Override base price by percentage</small>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Tariff Override ($)</label>
                                    <input type="number" className="input-field" value={editData.tariff_override} onChange={e => setEditData({ ...editData, tariff_override: e.target.value })} placeholder="e.g. 5000" />
                                    <small style={{ color: '#64748b' }}>Fixed price (ignores % if set)</small>
                                </div>
                            </div>
                        </div>
                    </Modal>

                    {/* Pay Debt Modal (in Details View) */}
                    <Modal
                        isOpen={debtModalOpen}
                        onClose={() => setDebtModalOpen(false)}
                        title={t('pay_debt')}
                        footer={
                            <>
                                <button className="btn btn-secondary" onClick={() => setDebtModalOpen(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handlePayDebt}>{t('confirm_payment')}</button>
                            </>
                        }
                    >
                        <div>
                            <p style={{ marginBottom: '1rem' }}>Enter amount to pay:</p>
                            <label className="input-label">{t('amount')} ($)</label>
                            <input className="input-field" type="number" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />

                            <label className="input-label" style={{ marginTop: '1rem' }}>{t('payment_method')}</label>
                            <select className="input-field" value={debtParams.method} onChange={e => setDebtParams({ ...debtParams, method: e.target.value })}>
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                            </select>
                        </div>
                    </Modal>

                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                    <a href="#" className="sidebar-link active">{t('patients')}</a>
                </nav>
            </aside>
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 className="title">{t('patients_list')}</h1>
                        <span style={{
                            background: '#e2e8f0',
                            color: '#475569',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}>
                            {patients.length}
                        </span>
                        <button
                            onClick={() => { setLoading(true); fetchPatients(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '0.5rem' }}
                            title={t('refresh_list')}
                        >
                            🔄
                        </button>
                    </div>
                    {user.role === 'secretary' && (
                        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                            {showCreate ? t('cancel') : t('register_new_patient')}
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className="input-field"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                {createMsg && <div style={{ padding: '1rem', background: createMsg.includes('Failed') ? '#fee2e2' : '#dcfce7', color: createMsg.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{createMsg}</div>}

                {showCreate && (
                    <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                        <h3>{t('register_new_patient')}</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">{t('username')}</label>
                                    <input className="input-field" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('password')}</label>
                                    <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('full_name')}</label>
                                <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">{t('dni')}</label>
                                    <input className="input-field" value={newDni} onChange={e => setNewDni(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Insurance (Obra Social)</label>
                                    <input className="input-field" value={newInsurance} onChange={e => setNewInsurance(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label className="input-label">Email</label>
                                <input className="input-field" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('dob')}</label>
                                    <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary">{t('create_account')}</button>
                        </form>
                    </div>
                )}

                <div className="card">
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {filteredPatients.length === 0 ? <li style={{ padding: '1rem', color: '#64748b' }}>{t('no_patients_found')}</li> : filteredPatients.map(p => (
                            <li key={p.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ textTransform: 'capitalize' }}>{p.full_name}</strong>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {p.dni && `${t('dni')}: ${p.dni} | `}
                                        {p.insurance && `OS: ${p.insurance} | `}
                                        {p.email && <a href={`mailto:${p.email}`} style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '0.5rem' }} onClick={(e) => e.stopPropagation()}>✉️</a>}
                                        {p.phone && (
                                            <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }} onClick={(e) => e.stopPropagation()}>
                                                {p.phone}
                                            </a>
                                        )}
                                    </div>
                                    {Number(p.total_debt) > 0 && (
                                        <div
                                            onClick={(e) => openDebtModal(e, p.id, p.total_debt)}
                                            style={{ marginTop: '0.25rem', display: 'inline-block', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #fecaca' }}
                                            title="Click to Pay Debt"
                                        >
                                            {t('debt')}: ${p.total_debt}
                                        </div>
                                    )}
                                </div>

                                {/* Ratings Column */}
                                <div style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
                                    <div style={{ textAlign: 'center' }} title={`${t('rating_financial_tooltip')}: $${p.total_debt}`}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{t('rating_financial')}</div>
                                        <div style={{ color: '#fbbf24' }}>
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateFinancialRating(Number(p.total_debt)) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }} title={`${t('rating_attendance_tooltip')}: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{t('rating_attendance')}</div>
                                        <div style={{ color: '#3b82f6' }}>
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateAttendanceRating(p.total_appointments, p.missed_appointments) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                    <div
                                        style={{ textAlign: 'center', cursor: 'pointer' }}
                                        title={t('rating_behavior_tooltip')}
                                        onClick={() => handleBehaviorRatingChange(p.id, ((p.behavior_rating || 5) % 5) + 1)}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{t('rating_behavior')}</div>
                                        <div style={{ color: '#ec4899' }}>
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= (p.behavior_rating || 5) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                </div>

                                <button className="btn btn-accent" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(p.id)}>
                                    {t('view_history')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pay Debt Modal for List View */}
                <Modal
                    isOpen={debtModalOpen}
                    onClose={() => setDebtModalOpen(false)}
                    title={t('pay_debt')}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setDebtModalOpen(false)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handlePayDebt}>{t('confirm_payment')}</button>
                        </>
                    }
                >
                    <div>
                        <p style={{ marginBottom: '1rem' }}>Enter amount to pay:</p>
                        <label className="input-label">{t('amount')} ($)</label>
                        <input className="input-field" type="number" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />

                        <label className="input-label" style={{ marginTop: '1rem' }}>{t('payment_method')}</label>
                        <select className="input-field" value={debtParams.method} onChange={e => setDebtParams({ ...debtParams, method: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                        </select>
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default Patients;
