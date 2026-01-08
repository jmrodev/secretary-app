import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';
import PatientSearchSelect from '../components/PatientSearchSelect';
import Sidebar from '../components/Sidebar';
import { formatPrice } from '../utils/format';
import { timeAgo } from '../utils/time';

const MedicalDocuments = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
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
    const [bonified, setBonified] = useState(false); // [NEW]

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
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    // Confirm Delete File State
    const [fileToDelete, setFileToDelete] = useState(null);

    const handleFileDeleteClick = (file) => {
        setFileToDelete(file);
    };

    const confirmFileDelete = async () => {
        if (!fileToDelete) return;
        try {
            await api.delete(`/medical/files/${fileToDelete.id}`);
            showMessage(t('file_deleted') || 'Archivo eliminado correctamente', 'success');
            fetchFiles();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setFileToDelete(null);
        }
    };


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
            // const pRes = await api.get('/users/patients'); // Removed in favor of async search
            // setPatients(pRes.data);
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
                request_note: reqNote,
                bonified // [NEW]
            });
            showMessage(t('request_sent'), 'success');
            setReqNote('');
            setBonified(false); // Reset
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        }
    };

    const handleUpdateStatus = async (id, status, note = '') => {
        try {
            await api.patch(`/medical/requests/${id}`, { status, doctor_note: note });
            fetchRequests();
            showMessage(t('status_updated'), 'success');
        } catch (err) {
            showMessage(t('update_failed'), 'error');
        }
    };

    const openActionModal = (type, id) => {
        setActionModal({ open: true, type, id });
        setActionNote(type === 'completed' ? t('approve') : '');
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
            showMessage(t('file_uploaded'), 'success');
            setFileDesc('');
            setSelectedFile(null);
            // Reset file input via key or id if necessary, but simple for now
            fetchFiles();
        } catch (err) {
            showMessage(t('upload_failed'), 'error');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <h1 className="title">{t('medical_documents')}</h1>

                <div className="tabs-container">
                    {['requests', 'files', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab === 'requests' ? t('requests_workflow') : (tab === 'files' ? t('file_repository') : t('prescriptions_licenses'))}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder={t('search_docs_placeholder')}
                        className="input-field"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '500px' }}
                    />
                </div>

                {activeTab === 'requests' && (
                    <div className="grid-requests-layout">
                        {(user.role === 'secretary') && (
                            <div className="card">
                                <h3>{t('new_request')}</h3>
                                <form onSubmit={handleCreateRequest}>
                                    <div className="input-group">
                                        <label className="input-label">{t('request_type')}</label>
                                        <select className="input-field" value={reqType} onChange={e => setReqType(e.target.value)}>
                                            <option value="prescription">{t('prescription')}</option>
                                            <option value="license">{t('medical_license')}</option>
                                            <option value="certificate">{t('certificate') || 'Certificado'}</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('patient_label')}</label>
                                        <PatientSearchSelect
                                            value={selectedPatient}
                                            onChange={setSelectedPatient}
                                            placeholder={t('select_patient')}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('doctor_label')}</label>
                                        <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                                            <option value="">{t('select_doctor')}</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('note_for_doctor')}</label>
                                        <textarea className="input-field" rows="3" value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="e.g. Needs Ibuprofen 600mg" required />
                                    </div>
                                    <div className="input-group-row-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="req-bonified"
                                            checked={bonified}
                                            onChange={e => setBonified(e.target.checked)}
                                            className="w-auto"
                                        />
                                        <label htmlFor="req-bonified" className="input-label mb-0 cursor-pointer">
                                            {t('bonificado') || 'Bonificado (Free/Waived)'}
                                        </label>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('send_request')}</button>
                                </form>
                            </div>
                        )}

                        <div className="card" style={{ gridColumn: user.role !== 'secretary' ? '1 / -1' : 'auto' }}>
                            <h3>{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
                            {requests.filter(filterItem).length === 0 ? <p className="text-muted p-4">{t('no_requests')}</p> : (
                                <div className="request-list-container">
                                    {requests.filter(filterItem).map(r => (
                                        <div key={r.id} className={`request-card-item ${r.status !== 'pending' ? 'opacity-75 bg-slate-50' : ''}`}>
                                            <div className="request-header">
                                                <div>
                                                    <span className={`tag ${r.type === 'prescription' ? 'tag-blue' : 'tag-purple'} mr-2`}>
                                                        {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : r.type)}
                                                    </span>
                                                    <span className="font-bold text-slate-800">{r.patient_name}</span>
                                                </div>
                                                <span className={`tag ${r.status === 'pending' ? 'tag-amber' : (r.status === 'completed' ? 'tag-green' : 'tag-red')}`}>
                                                    {t(r.status) || r.status}
                                                </span>
                                            </div>

                                            <div className="text-sm text-slate-600 mb-2">
                                                <span className="font-medium">{t('doctor_label')}:</span> Dr. {r.doctor_name || 'Unknown'}
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 italic border border-slate-100">
                                                "{r.request_note}"
                                            </div>

                                            {r.doctor_note && (
                                                <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-100">
                                                    <strong>{t('doctor_says')}:</strong> {r.doctor_note}
                                                </div>
                                            )}

                                            <div className="status-row">
                                                <div className={`tag ${r.payment_status === 'paid' ? 'tag-green' : (r.payment_status === 'debt' ? 'tag-red' : 'tag-slate')}`}>
                                                    {r.payment_status === 'paid' ? `PAID (${r.payment_method || 'CASH'})` :
                                                        (r.payment_status === 'debt' ? `DEBT ${formatPrice(r.debt_amount)}` : 'PENDING')}
                                                </div>
                                                <span className="text-xs text-muted ml-auto">{timeAgo(r.created_at)}</span>

                                                <div className="flex gap-2 ml-4">
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
                                                            className="btn btn-sm-compact btn-primary"
                                                            title="Charge"
                                                        >
                                                            $ Charge
                                                        </button>
                                                    )}
                                                    {user.role === 'admin' && (
                                                        <button
                                                            className="btn btn-sm-compact btn-danger"
                                                            onClick={async () => {
                                                                if (!window.confirm("¿Seguro que desea eliminar?")) return;
                                                                try {
                                                                    await api.delete(`/medical/requests/${r.id}`);
                                                                    fetchRequests();
                                                                } catch (e) {
                                                                    alert("Error: " + (e.response?.data?.message || e.message));
                                                                }
                                                            }}
                                                            title="Delete"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {user.role === 'doctor' && r.status === 'pending' && (
                                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                                                    <button onClick={() => openActionModal('completed', r.id)} className="btn btn-primary btn-sm">{t('mark_as_done')}</button>
                                                    <button onClick={() => openActionModal('rejected', r.id)} className="btn btn-danger btn-sm">{t('reject')}</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {
                    activeTab === 'files' && (
                        <div className="grid-requests-layout">
                            <div className="card">
                                <h3>{t('upload_document')}</h3>
                                <form onSubmit={handleFileUpload}>
                                    <div className="input-group">
                                        <label className="input-label">{t('patient_label')}</label>
                                        <PatientSearchSelect
                                            value={filePatient}
                                            onChange={setFilePatient}
                                            placeholder={t('select_patient')}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('description')}</label>
                                        <input className="input-field" value={fileDesc} onChange={e => setFileDesc(e.target.value)} placeholder="e.g. Lab Results PDF" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('file')}</label>
                                        <input type="file" className="input-field" onChange={e => setSelectedFile(e.target.files[0])} required />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('upload_file')}</button>
                                </form>
                            </div>

                            <div className="card">
                                <h3>{t('file_repository')}</h3>
                                {files.filter(filterItem).length === 0 ? <p className="text-muted p-4">{t('no_files')}</p> : (
                                    <div className="file-grid">
                                        {files.filter(filterItem).map(f => (
                                            <div key={f.id} className="file-card group" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${f.file_url}`, '_blank')}>
                                                <div className="flex justify-between items-start">
                                                    <div className="file-icon-placeholder">
                                                        📄
                                                    </div>
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">{f.file_type.split('/')[1] || 'FILE'}</span>
                                                </div>

                                                <div className="file-info">
                                                    <h4>{f.description || f.file_name}</h4>
                                                    <div className="file-meta">
                                                        {f.patient_name}
                                                    </div>
                                                    <div className="file-meta text-xs">
                                                        By {f.uploader_name}
                                                    </div>
                                                </div>

                                                {user.role === 'admin' && (
                                                    <button
                                                        className="btn btn-sm-compact btn-danger mt-2 w-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFileDeleteClick(f);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Confirm File Delete Modal */}
                <Modal
                    isOpen={!!fileToDelete}
                    onClose={() => setFileToDelete(null)}
                    title={t('confirm_delete') || "Confirmar Eliminación"}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setFileToDelete(null)}>{t('cancel')}</button>
                            <button className="btn btn-danger" style={{ background: '#ef4444', color: 'white' }} onClick={confirmFileDelete}>{t('delete') || "Eliminar"}</button>
                        </>
                    }
                >
                    <p>¿Seguro que desea eliminar el archivo <strong>{fileToDelete?.file_name}</strong>?</p>
                    <p className="text-sm text-muted">Esta acción no se puede deshacer.</p>
                </Modal>

                {
                    activeTab === 'history' && (
                        <div style={{ display: 'grid', gap: '2rem' }}>
                            <div className="card">
                                <h3>{t('prescriptions_licenses')}</h3>

                                <h4 style={{ marginTop: '1.5rem' }}>{t('recent_prescriptions')}</h4>
                                {prescriptions.filter(filterItem).length === 0 ? <p className="text-muted">{t('none')}</p> : (
                                    <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
                                        {prescriptions.filter(filterItem).map(p => (
                                            <li key={p.id}
                                                onClick={() => setSelectedPrescription(p)}
                                                className="list-item-hover flex-between-center p-3 border-b-divider cursor-pointer"
                                            >
                                                <div>
                                                    <div><strong>{new Date(p.created_at).toLocaleDateString()}</strong> - {p.patient_name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Dr. {p.doctor_name}</div>
                                                </div>
                                                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{t('view') || 'View'}</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )
                }

            </main >

            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={actionModal.type === 'completed' ? t('approve_request') : t('reject_request')}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>{t('cancel')}</button>
                        <button className="btn btn-primary" onClick={confirmAction}>{actionModal.type === 'completed' ? t('approve') : t('reject')}</button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">
                        {actionModal.type === 'completed' ? t('message_optional') : t('reason_rejection')}
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

            {/* Prescription Detail Modal */}
            <Modal
                isOpen={!!selectedPrescription}
                onClose={() => setSelectedPrescription(null)}
                title={t('prescription_details')}
                footer={
                    <button className="btn btn-primary" onClick={() => setSelectedPrescription(null)}>{t('close')}</button>
                }
            >
                {selectedPrescription && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label className="input-label">{t('date')}</label>
                            <div>{new Date(selectedPrescription.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="input-label">{t('patient_label')}</label>
                            <div>{selectedPrescription.patient_name} <span className="text-muted">({selectedPrescription.patient_dni})</span></div>
                        </div>
                        <div>
                            <label className="input-label">{t('doctor_label')}</label>
                            <div>{selectedPrescription.doctor_name}</div>
                        </div>
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>{t('medications')}</label>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedPrescription.medications}</pre>
                        </div>
                        {selectedPrescription.instructions && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <label className="input-label">{t('instructions_notes')}</label>
                                <div style={{ padding: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    {selectedPrescription.instructions}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default MedicalDocuments;
