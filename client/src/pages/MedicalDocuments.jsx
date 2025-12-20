import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';

const MedicalDocuments = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const [activeTab, setActiveTab] = useState('requests'); // requests | files | history
    const [searchTerm, setSearchTerm] = useState('');

    const normalizeText = (text) => {
        if (!text) return "";
        return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filterItem = (item) => {
        const term = normalizeText(searchTerm);
        return (
            normalizeText(item.patient_name).includes(term) ||
            normalizeText(item.doctor_name).includes(term) ||
            normalizeText(item.patient_dni).includes(term) ||
            normalizeText(item.patient_address).includes(term) ||
            normalizeText(item.description).includes(term) || // For files
            normalizeText(item.file_name).includes(term) || // For files
            normalizeText(item.type).includes(term) // For requests/files
        );
    };

    // Requests State
    const [requests, setRequests] = useState([]);
    const [reqType, setReqType] = useState('prescription');
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [reqNote, setReqNote] = useState('');

    // Files State
    const [files, setFiles] = useState([]);
    const [filePatient, setFilePatient] = useState('');
    const [fileDesc, setFileDesc] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Action Modal State (Approve/Reject)
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    // Old Medical History State (Prescriptions/Licenses)
    const [prescriptions, setPrescriptions] = useState([]);
    const [licenses, setLicenses] = useState([]);

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchResources();
            fetchRequests();
        } else if (activeTab === 'files') {
            fetchResources(); // Need patients list for upload
            fetchFiles();
        } else if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchResources = async () => {
        try {
            const pRes = await api.get('/users/patients');
            setPatients(pRes.data);
            const dRes = await api.get('/users/doctors');
            setDoctors(dRes.data);
        } catch (err) { console.error(err); }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            setRequests(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFiles = async () => {
        try {
            const res = await api.get('/medical/files');
            setFiles(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const pRes = await api.get('/medical/prescriptions');
            setPrescriptions(pRes.data);
            const lRes = await api.get('/medical/licenses');
            setLicenses(lRes.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: selectedDoctor,
                request_note: reqNote
            });
            showMessage("Request sent to Doctor", 'success');
            setReqNote('');
            fetchRequests();
        } catch (err) {
            showMessage("Failed to send request", 'error');
        }
    };

    const handleUpdateStatus = async (id, status, note = '') => {
        try {
            await api.patch(`/medical/requests/${id}`, { status, doctor_note: note });
            fetchRequests();
            showMessage(`Request ${status}`, 'success');
        } catch (err) {
            showMessage("Failed to update", 'error');
        }
    };

    const openActionModal = (type, id) => {
        setActionModal({ open: true, type, id });
        setActionNote(type === 'completed' ? 'Approved' : '');
    };

    const confirmAction = () => {
        if (!actionModal.id) return;
        handleUpdateStatus(actionModal.id, actionModal.type, actionNote);
        setActionModal({ open: false, type: '', id: null });
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !filePatient) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('patient_id', filePatient);
        formData.append('description', fileDesc);

        try {
            await api.post('/medical/files', formData);
            showMessage("File uploaded successfully", 'success');
            setFileDesc('');
            setSelectedFile(null);
            // Reset file input via key or id if necessary, but simple for now
            fetchFiles();
        } catch (err) {
            showMessage("Upload failed", 'error');
        }
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    <a href="#" className="sidebar-link active">Documents</a>
                </nav>
            </aside>

            <main className="main-content">
                <h1 className="title">Medical Documents</h1>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'requests' ? '2px solid #3b82f6' : 'none', fontWeight: activeTab === 'requests' ? 'bold' : 'normal', cursor: 'pointer' }}
                    >
                        Requests Workflow
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'files' ? '2px solid #3b82f6' : 'none', fontWeight: activeTab === 'files' ? 'bold' : 'normal', cursor: 'pointer' }}
                    >
                        File Repository
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : 'none', fontWeight: activeTab === 'history' ? 'bold' : 'normal', cursor: 'pointer' }}
                    >
                        Prescriptions & Licenses
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search by name, address, DNI, doctor..."
                        className="input-field"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '500px' }}
                    />
                </div>

                {activeTab === 'requests' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                        {(user.role === 'secretary') && (
                            <div className="card">
                                <h3>New Request</h3>
                                <form onSubmit={handleCreateRequest}>
                                    <div className="input-group">
                                        <label className="input-label">Type</label>
                                        <select className="input-field" value={reqType} onChange={e => setReqType(e.target.value)}>
                                            <option value="prescription">Prescription</option>
                                            <option value="license">Medical License</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Patient</label>
                                        <select className="input-field" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Doctor</label>
                                        <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Note for Doctor</label>
                                        <textarea className="input-field" rows="3" value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="e.g. Needs Ibuprofen 600mg" required />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Request</button>
                                </form>
                            </div>
                        )}

                        <div className="card" style={{ gridColumn: user.role !== 'secretary' ? '1 / -1' : 'auto' }}>
                            <h3>{user.role === 'doctor' ? 'Pending Requests' : 'Request Status'}</h3>
                            {requests.filter(filterItem).length === 0 ? <p>No requests found.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {requests.filter(filterItem).map(r => (
                                        <li key={r.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: r.status === 'pending' ? '#fff' : '#f8fafc', opacity: r.status === 'pending' ? 1 : 0.75 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', color: r.type === 'prescription' ? '#3b82f6' : '#8b5cf6' }}>{r.type}</span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                    background: r.status === 'pending' ? '#fef3c7' : (r.status === 'completed' ? '#dcfce7' : '#fee2e2'),
                                                    color: r.status === 'pending' ? '#b45309' : (r.status === 'completed' ? '#166534' : '#991b1b')
                                                }}>
                                                    {r.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <div><strong>Patient:</strong> {r.patient_name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                        background: r.payment_status === 'paid' ? '#dcfce7' : (r.payment_status === 'debt' ? '#fee2e2' : '#f1f5f9'),
                                                        color: r.payment_status === 'paid' ? '#166534' : (r.payment_status === 'debt' ? '#991b1b' : '#475569')
                                                    }}>
                                                        {r.payment_status === 'paid' ? `PAID (${r.payment_method || 'CASH'})` :
                                                            (r.payment_status === 'debt' ? `DEBT $${r.debt_amount}` : 'PENDING')}
                                                    </span>
                                                    {(r.payment_status !== 'paid') && (user.role === 'secretary' || user.role === 'doctor') && (
                                                        <button
                                                            onClick={() => setPaymentModal({
                                                                open: true,
                                                                initialData: {
                                                                    type: 'income_patient',
                                                                    amount: '',
                                                                    description: `Request: ${r.type} for ${r.patient_name}`,
                                                                    patientId: r.patient_user_id,
                                                                    patientName: r.patient_name,
                                                                    doctorId: r.doctor_id
                                                                },
                                                                reqId: r.id
                                                            })}
                                                            title="Charge"
                                                            style={{ border: 'none', background: '#eab308', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                                                        >
                                                            $
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#475569' }}>"{r.request_note}"</div>
                                            {r.doctor_note && <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderLeft: '3px solid #22c55e', fontSize: '0.9rem' }}><strong>Doctor says:</strong> {r.doctor_note}</div>}

                                            {user.role === 'doctor' && r.status === 'pending' && (
                                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => openActionModal('completed', r.id)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Mark as Done</button>
                                                    <button onClick={() => openActionModal('rejected', r.id)} className="btn btn-accent" style={{ fontSize: '0.8rem', background: '#ef4444' }}>Reject</button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                        <div className="card">
                            <h3>Upload Document</h3>
                            <form onSubmit={handleFileUpload}>
                                <div className="input-group">
                                    <label className="input-label">Patient</label>
                                    <select className="input-field" value={filePatient} onChange={e => setFilePatient(e.target.value)} required>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <input className="input-field" value={fileDesc} onChange={e => setFileDesc(e.target.value)} placeholder="e.g. Lab Results PDF" required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">File</label>
                                    <input type="file" className="input-field" onChange={e => setSelectedFile(e.target.files[0])} required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Upload File</button>
                            </form>
                        </div>

                        <div className="card">
                            <h3>File Repository</h3>
                            {files.filter(filterItem).length === 0 ? <p>No files found.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {files.filter(filterItem).map(f => (
                                        <li key={f.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <a href={`http://localhost:5000${f.file_url}`} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', color: '#3b82f6', textDecoration: 'none', fontSize: '1.05rem' }}>
                                                    {f.description || f.file_name}
                                                </a>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                    <strong>Patient:</strong> {f.patient_name} • <strong>By:</strong> <span style={{ textTransform: 'capitalize' }}>{f.uploader_name}</span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>{f.file_type.split('/')[1] || 'FILE'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div className="card">
                            <h3>Prescriptions & Licenses History</h3>

                            <h4 style={{ marginTop: '1.5rem' }}>Recent Prescriptions</h4>
                            {prescriptions.filter(filterItem).length === 0 ? <p className="text-muted">None.</p> : (
                                <ul style={{ paddingLeft: '1rem' }}>
                                    {prescriptions.filter(filterItem).map(p => <li key={p.id}>{new Date(p.created_at).toLocaleDateString()} - <strong>{p.patient_name}</strong>: {p.medications} (Dr. {p.doctor_name})</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

            </main>

            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={actionModal.type === 'completed' ? 'Approve Request' : 'Reject Request'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>Cancel</button>
                        <button className="btn btn-primary" onClick={confirmAction}>{actionModal.type === 'completed' ? 'Approve' : 'Reject'}</button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">
                        {actionModal.type === 'completed' ? 'Message (Optional)' : 'Reason for Rejection'}
                    </label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal >

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                requestId={paymentModal.reqId}
                onSuccess={async (data) => {
                    if (paymentModal.reqId) {
                        try {
                            await api.patch(`/medical/requests/${paymentModal.reqId}/payment`, { status: data.status });
                            fetchRequests();
                        } catch (e) { console.error(e); }
                    }
                }}
            />
        </div >
    );
};

export default MedicalDocuments;
