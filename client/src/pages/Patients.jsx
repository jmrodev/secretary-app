import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';

import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import CurrencyInput from '../components/CurrencyInput';

const Patients = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [insurances, setInsurances] = useState([]); // [NEW]

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
    const [newInsuranceId, setNewInsuranceId] = useState(''); // [NEW] (was newInsurance)
    const [newAffiliateNumber, setNewAffiliateNumber] = useState(''); // [NEW]
    const [newEmail, setNewEmail] = useState('');
    const [createMsg, setCreateMsg] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const patientsPerPage = 50;

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

    // Debt Payment Modal State
    const [debtModalOpen, setDebtModalOpen] = useState(false);
    const [debtParams, setDebtParams] = useState({ patientId: null, amount: '', method: 'cash' });

    // Prescription Modal State
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientId: null, patientName: '', medications: '', instructions: '' });

    const handleSavePrescription = async () => {
        if (!prescribeModal.medications.trim()) {
            showMessage(t('please_enter_meds'), 'warning');
            return;
        }

        try {
            await api.post('/medical/prescriptions', {
                // Allows prescribing without appointment ID if directly from patient list
                patient_id: prescribeModal.patientId,
                appointment_id: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions
            });
            showMessage(t('prescription_created'), 'success');
            setPrescribeModal({ open: false, apptId: null, patientId: null, patientName: '', medications: '', instructions: '' });
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_prescription');
            showMessage(errMsg, 'error');
        }
    };

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

    // [NEW] Fetch Doctors for assignment
    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // [NEW] Fetch Insurances
    const fetchInsurances = async () => {
        try {
            const res = await api.get('/insurances');
            setInsurances(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
        fetchInsurances(); // [NEW]
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
                insurance_id: newInsuranceId, // [NEW]
                affiliate_number: newAffiliateNumber, // [NEW]
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
            setNewInsuranceId('');
            setNewAffiliateNumber('');
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
            insurance_id: details.insurance_id || '', // [NEW]
            affiliate_number: details.affiliate_number || (details.insurance && !details.insurance_id ? details.insurance : '') || '', // Fallback to old field if exists and no ID
            email: details.email || '',
            dob: details.dob ? details.dob.split('T')[0] : '',

            medical_history: details.medical_history || '',
            tariff_percent: details.tariff_percent || 0,
            tariff_override: details.tariff_override || '',
            assignedDoctors: details.assignedDoctors ? details.assignedDoctors.map(d => d.id) : []
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

    const toggleAssignedDoctor = (docId) => {
        setEditData(prev => {
            const current = prev.assignedDoctors || [];
            if (current.includes(docId)) {
                return { ...prev, assignedDoctors: current.filter(id => id !== docId) };
            } else {
                return { ...prev, assignedDoctors: [...current, docId] };
            }
        });
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
                <Sidebar />
                <main className="main-content">
                    <div>{t('loading')}</div>
                </main>
            </div>
        );
    }

    if (selectedPatient && details) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content max-w-800 mx-auto">
                    <button onClick={() => { setSelectedPatient(null); setDetails(null); }} className="btn btn-secondary mb-4 flex items-center gap-2">
                        &larr; {t('back_to_list')}
                    </button>

                    <h1 className="title capitalize">{details.full_name}</h1>

                    <div className="card mb-8">
                        <div className="flex-between">
                            <h3>{t('patient_info')}</h3>
                            <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={handleEditClick}>
                                ✏️ {t('edit_info')}
                            </button>
                        </div>
                        <div className="patient-info-grid">
                            <p><strong>{t('dni')}:</strong> {details.dni || 'N/A'}</p>
                            <p><strong>Obra Social:</strong> {details.insurance_name || 'N/A'}</p>
                            <p><strong>Nro Afiliado:</strong> {(details.affiliate_number || details.insurance || 'N/A').replace(/^Afiliado/, '').trim()}</p>
                            <p><strong>Phone:</strong> {details.phone ? <a href={`https://wa.me/${details.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="detail-link">{details.phone}</a> : 'N/A'}</p>
                            <p><strong>Email:</strong> {details.email ? <a href={`mailto:${details.email}`} className="detail-link">{details.email}</a> : 'N/A'}</p>
                            <p><strong>{t('dob')}:</strong> {details.dob ? new Date(details.dob).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex gap-8 mt-4">
                            <p><strong>{t('address')}:</strong> {details.address || 'N/A'}</p>
                            <p><strong>{t('accumulated_medical_leave')}:</strong> <span className="font-bold text-purple-600">{details.accumulated_days || 0} Days</span></p>
                        </div>
                        <p className="mt-2"><strong>{t('micro_history')}:</strong> {details.medical_history || 'N/A'}</p>
                    </div>

                    <div className="card mb-4">
                        <h3>{t('previous_appointments')}</h3>
                        {details.appointments.length === 0 ? <p className="text-muted mt-2">{t('no_appointments')}</p> : (
                            <ul className="history-list mt-2">
                                {details.appointments.map(a => (
                                    <li key={a.id} className="history-item">
                                        <div className="history-item-content">
                                            <span>{new Date(a.appointment_date).toLocaleDateString()} - <strong>Dr. {a.doctor_name}</strong></span>
                                            <div className="text-sm-muted">
                                                {a.status === 'cancelled' && a.cancellation_reason ? `Reason: ${a.cancellation_reason}` : (a.reason || '')}
                                            </div>
                                        </div>
                                        <span className={`status-badge ${a.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>{a.status}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card mb-4">
                        <h3>{t('medical_documents')}</h3>

                        <h4 className="text-muted font-bold mt-4 mb-2 text-sm uppercase">{t('prescriptions_licenses')}</h4>
                        {details.prescriptions && details.prescriptions.length === 0 ? <p className="text-muted">None.</p> : (
                            <ul className="history-list">
                                {details.prescriptions && details.prescriptions.map(p => (
                                    <li key={`${p.type}-${p.id}`} className="history-item">
                                        <div className="history-item-content">
                                            <span className="capitalize">{new Date(p.created_at).toLocaleDateString()} - <strong>{p.type === 'prescription' ? '💊 Receta' : '📄 Licencia'}</strong></span>
                                            <span className="text-sm-muted">Dr. {p.doctor_name}</span>
                                        </div>
                                        <div className="text-sm-muted mt-1">
                                            {p.type === 'prescription' ? (
                                                <span><strong>Rx:</strong> {p.diagnosis}</span> // diagnosis contains medications for Rx
                                            ) : (
                                                <span><strong>Dx:</strong> {p.diagnosis} <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded border font-semibold text-xs">Days: {p.days}</span></span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <h4 className="text-muted font-bold mt-6 mb-2 text-sm uppercase">Uploaded Files</h4>
                        {details.files && details.files.length === 0 ? <p className="text-muted">No uploaded files.</p> : (
                            <ul className="history-list">
                                {details.files && details.files.map(f => (
                                    <li key={f.id} className="history-item">
                                        <div className="history-item-content">
                                            <a href={f.file_url} target="_blank" rel="noreferrer" className="detail-link font-bold">
                                                {f.description || f.file_name}
                                            </a>
                                            <span className="text-xs-muted">
                                                Uploaded by {f.uploader_name} on {new Date(f.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card mb-4">
                        <h3>{t('financial_history_debt')}</h3>
                        {(!details.transactions || details.transactions.length === 0) ? <p className="text-muted mt-2">No transactions found.</p> : (
                            <>
                                <div className="debt-summary-box mt-4">
                                    <div>
                                        <strong>{t('total_debt')}: </strong>
                                        <span className="debt-amount-highlight">
                                            ${details.transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {details.transactions.some(t => t.status === 'pending') && (
                                        <button className="btn btn-primary flex items-center gap-2" onClick={(e) => openDebtModal(e, details.id, details.transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0))}>
                                            💸 {t('pay_debt')}
                                        </button>
                                    )}
                                </div>
                                <table className="transactions-table">
                                    <thead>
                                        <tr>
                                            <th>{t('transaction_date')}</th>
                                            <th>{t('description')}</th>
                                            <th>{t('amount')}</th>
                                            <th>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                <td>{tx.description}</td>
                                                <td className="font-bold">${tx.amount}</td>
                                                <td>
                                                    <span className={`status-badge ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                        size="lg"
                    >
                        <div className="flex-col gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('full_name')}</label>
                                <input className="input-field" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} />
                            </div>
                            <div className="grid-cols-2 gap-4 grid">
                                <div className="input-group">
                                    <label className="input-label">{t('dni')}</label>
                                    <input className="input-field" value={editData.dni} onChange={e => setEditData({ ...editData, dni: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Obra Social</label>
                                    <select className="input-field" value={editData.insurance_id} onChange={e => setEditData({ ...editData, insurance_id: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {insurances.map(ins => (
                                            <option key={ins.id} value={ins.id}>{ins.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Nro Afiliado</label>
                                <input className="input-field" value={editData.affiliate_number} onChange={e => setEditData({ ...editData, affiliate_number: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input className="input-field" type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                            </div>
                            <div className="grid-2-cols">
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
                                <label className="input-label">Assigned Doctors</label>
                                <div className="doctor-selection-grid">
                                    {doctors.map(doc => (
                                        <label key={doc.id} className="doctor-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={editData.assignedDoctors?.includes(doc.id) || false}
                                                onChange={() => toggleAssignedDoctor(doc.id)}
                                            />
                                            Dr. {doc.full_name}
                                        </label>
                                    ))}
                                    {doctors.length === 0 && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No doctors found.</span>}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">{t('micro_history')}</label>
                                <textarea className="input-field" rows="3" value={editData.medical_history} onChange={e => setEditData({ ...editData, medical_history: e.target.value })} />
                            </div>

                            <div className="grid-2-cols border-t-divider pt-4">
                                <div className="input-group">
                                    <label className="input-label">Tariff Adjustment (%)</label>
                                    <input type="number" className="input-field" value={editData.tariff_percent} onChange={e => setEditData({ ...editData, tariff_percent: e.target.value })} placeholder="e.g. 10 for +10%" />
                                    <small style={{ color: '#64748b' }}>Override base price by percentage</small>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Tariff Override ($)</label>
                                    <CurrencyInput className="input-field" value={editData.tariff_override} onChange={e => setEditData({ ...editData, tariff_override: e.target.value })} placeholder="e.g. 5000" />
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
                            <CurrencyInput className="input-field" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />

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
            </div >
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex-between">
                    <div className="flex items-center gap-4">
                        <h1 className="title">{t('patients_list')}</h1>
                        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">
                            {patients.length}
                        </span>
                        <button
                            onClick={() => { setLoading(true); fetchPatients(); }}
                            className="btn btn-secondary btn-sm"
                            title={t('refresh_list')}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    {user.role === 'secretary' && (
                        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowCreate(!showCreate)}>
                            {showCreate ? `❌ ${t('cancel')}` : `➕ ${t('register_new_patient')}`}
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex items-center gap-4">
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className="input-field max-w-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="text-sm text-slate-600">
                        Mostrando {indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, filteredPatients.length)} de {filteredPatients.length}
                    </div>
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
                                    <label className="input-label">Obra Social</label>
                                    <select className="input-field" value={newInsuranceId} onChange={e => setNewInsuranceId(e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        {insurances.map(ins => (
                                            <option key={ins.id} value={ins.id}>{ins.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2-cols">
                                <div className="input-group">
                                    <label className="input-label">Nro Afiliado</label>
                                    <input className="input-field" value={newAffiliateNumber} onChange={e => setNewAffiliateNumber(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input className="input-field" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid-2-cols">
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

                <div className="card-transparent">
                    <ul className="item-grid">
                        {currentPatients.length === 0 ? <li className="text-muted p-4">{t('no_patients_found')}</li> : currentPatients.map(p => (
                            <li key={p.id} className="item-card">
                                <div>
                                    <strong style={{ textTransform: 'capitalize' }}>{p.full_name}</strong>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {p.dni && `${t('dni')}: ${p.dni} | `}
                                        {(p.insurance_name || p.insurance) && `OS: ${p.insurance_name || p.insurance} | `}
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
                                            className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200 cursor-pointer hover:bg-red-200 inline-block mt-1"
                                            title="Click to Pay Debt"
                                        >
                                            {t('debt')}: ${p.total_debt}
                                        </div>
                                    )}
                                </div>

                                {/* Ratings Column */}
                                <div className="flex gap-6 mr-4">
                                    <div className="rating-container" title={`${t('rating_financial_tooltip')}: $${p.total_debt}`}>
                                        <div className="rating-label">{t('rating_financial')}</div>
                                        <div className="rating-stars-gold">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateFinancialRating(Number(p.total_debt)) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                    <div className="rating-container" title={`${t('rating_attendance_tooltip')}: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                                        <div className="rating-label">{t('rating_attendance')}</div>
                                        <div className="rating-stars-blue">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateAttendanceRating(p.total_appointments, p.missed_appointments) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                    <div
                                        className="rating-container cursor-pointer"
                                        title={t('rating_behavior_tooltip')}
                                        onClick={() => handleBehaviorRatingChange(p.id, ((p.behavior_rating || 5) % 5) + 1)}
                                    >
                                        <div className="rating-label">{t('rating_behavior')}</div>
                                        <div className="rating-stars-pink">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= (p.behavior_rating || 5) ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <button className="btn btn-primary btn-sm flex items-center justify-center gap-2" onClick={() => handleViewDetails(p.id)}>
                                        🩺 {t('view_details') || 'Ver Ficha'}
                                    </button>
                                </div>
                            </li >
                        ))}
                    </ul>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="btn btn-secondary btn-sm"
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            ← Anterior
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="btn btn-secondary btn-sm"
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Siguiente →
                        </button>
                    </div>
                )}

                {/* Pay Debt Modal for List View */}
                < Modal
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
                        <CurrencyInput className="input-field" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />

                        <label className="input-label" style={{ marginTop: '1rem' }}>{t('payment_method')}</label>
                        <select className="input-field" value={debtParams.method} onChange={e => setDebtParams({ ...debtParams, method: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                        </select>
                    </div>
                </Modal >

                {/* Prescription Modal */}
                <Modal
                    isOpen={prescribeModal.open}
                    onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                    title={`${t('prescription_for') || 'Receta para'} ${prescribeModal.patientName}`}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim()}>{t('create')}</button>
                        </>
                    }
                >
                    <div className="flex-col-gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('medications')}</label>
                            <textarea className="input-field" rows="4" value={prescribeModal.medications} onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })} placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"} autoFocus />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('instructions')}</label>
                            <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."} />
                        </div>
                    </div>
                </Modal>
            </main >
        </div >
    );
};

export default Patients;
