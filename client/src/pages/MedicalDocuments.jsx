import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';
import PatientSearchSelect from '../components/PatientSearchSelect';
import Sidebar from '../components/Sidebar';
import { formatPrice } from '../utils/format';
import { timeAgo, isToday } from '../utils/time';
import MedicationAutocomplete from '../components/MedicationAutocomplete';

import MedicalRequestForm from '../components/MedicalRequestForm';
import MedicalRequestList from '../components/MedicalRequestList';

const MedicalDocuments = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { alert, confirm, doubleConfirm } = useModal();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('requests'); // requests | files | prescriptions | licenses | certificates
    const [requestsSubTab, setRequestsSubTab] = useState('list'); // new | list
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
    const [patientData, setPatientData] = useState(null); // [NEW] Full patient object
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [reqNote, setReqNote] = useState('');
    const [bonified, setBonified] = useState(false); // [NEW]
    const [sendToDoctor, setSendToDoctor] = useState(true); // [NEW] Forwarding toggle

    // Files State
    const [files, setFiles] = useState([]);
    const [filePatient, setFilePatient] = useState('');
    const [fileDesc, setFileDesc] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Action Modal State (Approve/Reject)
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Old Medical History State (Prescriptions/Licenses)
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [licenses, setLicenses] = useState([]);
    const [selectedLicense, setSelectedLicense] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ medications: '', instructions: '' });
    const [licenseEditData, setLicenseEditData] = useState({ start_date: '', days_duration: '', diagnosis: '' });
    const [requestEditData, setRequestEditData] = useState({ request_note: '', doctor_note: '', debt_amount: '' });
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

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);

    // Handle deep linking from Dashboard
    useEffect(() => {
        if (location.state?.patientName) {
            setSearchTerm(location.state.patientName);
        }
        if (location.state?.patientId) {
            console.log("Pre-selecting patient:", location.state.patientId);
            setSelectedPatient(location.state.patientId);
            setFilePatient(location.state.patientId);
        }
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

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
            const sorted = res.data.sort((a, b) => {
                const topStatus = ['pending', 'consult'];
                const aTop = topStatus.includes(a.status);
                const bTop = topStatus.includes(b.status);
                if (aTop && !bTop) return -1;
                if (!aTop && bTop) return 1;
                return new Date(b.created_at) - new Date(a.created_at); // Newest first
            });
            setRequests(sorted);
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
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: reqNote,
                bonified, // [NEW]
                status: sendToDoctor ? 'pending' : 'completed' // [NEW] logic
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');
            setReqNote('');
            setBonified(false); // Reset
            setSendToDoctor(true); // Reset
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
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

    const handleUpdatePrescription = async () => {
        if (!selectedPrescription) return;
        try {
            await api.put(`/medical/prescriptions/${selectedPrescription.id}`, editData);
            showMessage(t('prescription_updated') || 'Receta actualizada', 'success');
            setIsEditing(false);
            fetchHistory(); // Refresh list
            // Update the selected prescription object in state to show changes in modal
            setSelectedPrescription({ ...selectedPrescription, ...editData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleUpdateLicense = async () => {
        if (!selectedLicense) return;
        try {
            await api.put(`/medical/licenses/${selectedLicense.id}`, licenseEditData);
            showMessage(t('license_updated') || 'Licencia actualizada', 'success');
            setIsEditing(false);
            fetchHistory();
            setSelectedLicense({ ...selectedLicense, ...licenseEditData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeletePrescription = async (id) => {
        if (!await confirm(t('confirm_delete_prescription') || '¿Seguro que desea eliminar esta receta?')) return;
        try {
            await api.delete(`/medical/prescriptions/${id}`);
            showMessage(t('prescription_deleted') || 'Receta eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeleteLicense = async (id) => {
        if (!await confirm(t('confirm_delete_license') || '¿Seguro que desea eliminar esta licencia?')) return;
        try {
            await api.delete(`/medical/licenses/${id}`);
            showMessage(t('license_deleted') || 'Licencia eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleUpdateRequest = async () => {
        if (!selectedRequest) return;
        try {
            await api.put(`/medical/requests/${selectedRequest.id}`, requestEditData);
            showMessage(t('request_updated') || 'Solicitud actualizada', 'success');
            setIsEditing(false);
            fetchRequests();
            setSelectedRequest({ ...selectedRequest, ...requestEditData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeleteRequest = async (id, r) => {
        // [RULE] Only admin can delete completed from previous days
        if (user.role !== 'admin' && (r.status === 'completed' || r.status === 'rejected')) {
            if (!isToday(r.completed_at || r.updated_at)) {
                showMessage("Solo administradores pueden eliminar solicitudes finalizadas de días anteriores.", "warning");
                return;
            }
        }

        if (!await doubleConfirm(
            t('confirm_delete') || '¿Seguro que desea eliminar?',
            t('confirm_permanent_delete') || 'Esta acción eliminará el registro permanentemente. ¿Confirmar segunda vez?'
        )) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('deleted_success') || 'Eliminado correctamente', 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const combinedPrescriptions = [
        ...prescriptions.map(p => ({ ...p, _origin: 'prescription' })),
        ...requests.filter(r => r.type === 'prescription' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            medications: r.request_note,
            instructions: r.doctor_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const combinedLicenses = [
        ...licenses.map(l => ({ ...l, _origin: 'license' })),
        ...requests.filter(r => r.type === 'license' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            start_date: r.created_at,
            days_duration: '-',
            diagnosis: r.request_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const combinedCertificates = [
        ...requests.filter(r => r.type === 'certificate' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            description: r.request_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const handleViewItem = (item) => {
        if (item._origin === 'prescription') {
            setSelectedPrescription(item);
        } else if (item._origin === 'license') {
            setSelectedLicense(item);
        } else if (item._origin === 'request') {
            setSelectedRequest(item);
            setRequestEditData({
                request_note: item.request_note || '',
                doctor_note: item.doctor_note || '',
                debt_amount: item.debt_amount || ''
            });
        }
    };

    const myDoctorProfile = user.role === 'doctor' ? doctors.find(d => d.user_id === (user.user_id || user.id)) : null;

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <div className="medical-docs-header">
                    <div>
                        <h1 className="title">{t('medical_documents')}</h1>
                        <p className="subtitle">{t('medical_docs_subtitle') || 'Gestione requerimientos, archivos e historial de pacientes en un solo lugar.'}</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Optional Action buttons could go here */}
                    </div>
                </div>

                <div className="tabs-container">
                    {['requests', 'files', 'prescriptions', 'licenses', 'certificates'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab === 'requests' ? (
                                <><span className="icon">⚡</span> {t('requests_workflow')}</>
                            ) : tab === 'files' ? (
                                <><span className="icon">📂</span> {t('file_repository')}</>
                            ) : tab === 'prescriptions' ? (
                                <><span className="icon">💊</span> {t('prescriptions')}</>
                            ) : tab === 'licenses' ? (
                                <><span className="icon">📄</span> {t('medical_licenses')}</>
                            ) : (
                                <><span className="icon">📜</span> {t('certificates') || 'Certificados'}</>
                            )}
                        </button>
                    ))}
                </div>

                <div className="search-bar-container">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('search_docs_placeholder')}
                            className="search-bar-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {activeTab === 'requests' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 mb-2 p-1 bg-slate-100/50 rounded-lg w-fit">
                            <button
                                onClick={() => setRequestsSubTab('list')}
                                className={`tab-btn-small ${requestsSubTab === 'list' ? 'active' : ''}`}
                                style={{ border: 'none' }}
                            >
                                <span className="icon">📋</span> {t('request_status')}
                            </button>
                            <button
                                onClick={() => setRequestsSubTab('new')}
                                className={`tab-btn-small ${requestsSubTab === 'new' ? 'active' : ''}`}
                                style={{ border: 'none' }}
                            >
                                <span className="icon">➕</span> {t('new_request')}
                            </button>
                        </div>

                        {requestsSubTab === 'new' ? (
                            <div className="animate-fadeIn">
                                <MedicalRequestForm
                                    doctors={doctors}
                                    onRequestCreated={() => {
                                        fetchRequests();
                                        setRequestsSubTab('list');
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="card animate-fadeIn" style={{ gridColumn: user.role !== 'secretary' ? '1 / -1' : 'auto' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="m-0">{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
                                </div>
                                <MedicalRequestList
                                    requests={requests}
                                    filterItem={filterItem}
                                    handleDeleteRequest={handleDeleteRequest}
                                    openActionModal={openActionModal}
                                    setPaymentModal={setPaymentModal}
                                />
                            </div>
                        )}
                    </div>
                )}

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
                                    <div className="table-responsive">
                                        <table className="table-base">
                                            <thead>
                                                <tr>
                                                    <th>{t('file')}</th>
                                                    <th>{t('patient')}</th>
                                                    <th>{t('uploader')}</th>
                                                    <th>{t('type')}</th>
                                                    <th className="text-right">{t('actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {files.filter(filterItem).map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.open(f.file_url, '_blank')}>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl">📄</span>
                                                                <span className="font-bold">{f.description || f.file_name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{f.patient_name}</td>
                                                        <td>{f.uploader_name}</td>
                                                        <td>
                                                            <span className="text-xs bg-slate-100 text-main-500 px-2 py-1 rounded uppercase">{f.file_type.split('/')[1] || 'FILE'}</span>
                                                        </td>
                                                        <td>
                                                            <div className="flex justify-end gap-1">
                                                                {(user.role === 'admin' || user.role === 'secretary') && (
                                                                    <button
                                                                        className="btn-icon-base btn-icon-red"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleFileDeleteClick(f);
                                                                        }}
                                                                        title="Delete"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                    activeTab === 'prescriptions' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="text-main-800 mb-4 flex items-center gap-2">
                                <span>💊</span> {t('recent_prescriptions')}
                            </h3>
                            <div className="table-responsive">
                                <table className="table-base">
                                    <thead>
                                        <tr>
                                            <th>{t('date')}</th>
                                            <th>{t('patient')}</th>
                                            <th>{t('medications')}</th>
                                            <th>{t('doctor')}</th>
                                            <th className="text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedPrescriptions.filter(filterItem).map(p => (
                                            <tr key={`${p._origin}_${p.id}`} className="hover:bg-slate-50">
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{new Date(p.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted">{timeAgo(p.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="font-bold">{p.patient_name}</div>
                                                    {p._origin === 'request' && <span className="tag tag-slate text-[10px] py-0 px-1">{t('request')}</span>}
                                                </td>
                                                <td>
                                                    <div className="text-sm italic truncate max-w-xs" title={p.medications || p.request_note}>
                                                        {p.medications || p.request_note}
                                                    </div>
                                                </td>
                                                <td>Dr. {p.doctor_name}</td>
                                                <td>
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleViewItem(p)} className="btn-icon-base btn-icon-blue" title={t('view')}>👁️</button>
                                                        {(user.role === 'admin' || user.role === 'secretary') && (
                                                            <button
                                                                onClick={() => p._origin === 'prescription' ? handleDeletePrescription(p.id) : handleDeleteRequest(p.id, p)}
                                                                className="btn-icon-base btn-icon-red"
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {combinedPrescriptions.filter(filterItem).length === 0 && (
                                <div className="card text-center p-12">
                                    <p className="text-main-500">{t('none_found')}</p>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'licenses' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="text-main-800 mb-4 flex items-center gap-2">
                                <span>📄</span> {t('recent_licenses')}
                            </h3>
                            <div className="table-responsive">
                                <table className="table-base">
                                    <thead>
                                        <tr>
                                            <th>{t('date')}</th>
                                            <th>{t('patient')}</th>
                                            <th>{t('duration')}</th>
                                            <th>{t('diagnosis')}</th>
                                            <th>{t('doctor')}</th>
                                            <th className="text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedLicenses.filter(filterItem).map(l => (
                                            <tr key={`${l._origin}_${l.id}`} className="hover:bg-slate-50">
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{new Date(l.appointment_date || l.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted">{timeAgo(l.appointment_date || l.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="font-bold">{l.patient_name}</div>
                                                    {l._origin === 'request' && <span className="tag tag-slate text-[10px] py-0 px-1">{t('request')}</span>}
                                                </td>
                                                <td>
                                                    <span className="tag tag-blue">{l.days_duration} {t('days')}</span>
                                                </td>
                                                <td>
                                                    <div className="text-sm italic truncate max-w-xs" title={l.diagnosis}>
                                                        {l.diagnosis}
                                                    </div>
                                                </td>
                                                <td>Dr. {l.doctor_name}</td>
                                                <td>
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleViewItem(l)} className="btn-icon-base btn-icon-blue" title={t('view')}>👁️</button>
                                                        {(user.role === 'admin' || user.role === 'secretary') && (
                                                            <button
                                                                onClick={() => l._origin === 'license' ? handleDeleteLicense(l.id) : handleDeleteRequest(l.id, l)}
                                                                className="btn-icon-base btn-icon-red"
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {combinedLicenses.filter(filterItem).length === 0 && (
                                <div className="card text-center p-12">
                                    <p className="text-main-500">{t('none_found')}</p>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'certificates' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="text-main-800 mb-4 flex items-center gap-2">
                                <span>📜</span> {t('recent_certificates')}
                            </h3>
                            <div className="table-responsive">
                                <table className="table-base">
                                    <thead>
                                        <tr>
                                            <th>{t('date')}</th>
                                            <th>{t('patient')}</th>
                                            <th>{t('description')}</th>
                                            <th>{t('doctor')}</th>
                                            <th className="text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedCertificates.filter(filterItem).map(c => (
                                            <tr key={`${c._origin}_${c.id}`} className="hover:bg-slate-50">
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{new Date(c.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="font-bold">{c.patient_name}</div>
                                                    <span className="tag tag-slate text-[10px] py-0 px-1">{t('certificate')}</span>
                                                </td>
                                                <td>
                                                    <div className="text-sm italic truncate max-w-xs" title={c.description}>
                                                        {c.description}
                                                    </div>
                                                </td>
                                                <td>Dr. {c.doctor_name}</td>
                                                <td>
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleViewItem(c)} className="btn-icon-base btn-icon-blue" title={t('view')}>👁️</button>
                                                        {(user.role === 'admin' || user.role === 'secretary') && (
                                                            <button
                                                                onClick={() => handleDeleteRequest(c.id, c)}
                                                                className="btn-icon-base btn-icon-red"
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {combinedCertificates.filter(filterItem).length === 0 && (
                                <div className="card text-center p-12">
                                    <p className="text-main-500">{t('none_found')}</p>
                                </div>
                            )}
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
                onClose={() => {
                    setSelectedPrescription(null);
                    setIsEditing(false);
                }}
                title={t('prescription_details')}
                footer={
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleUpdatePrescription}>{t('save') || 'Guardar Changes'}</button>
                            </>
                        ) : (
                            <>
                                {(user.role === 'admin' || user.role === 'secretary' || (user.role === 'doctor' && myDoctorProfile?.id === selectedPrescription?.doctor_id)) && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setEditData({
                                                medications: selectedPrescription.medications,
                                                instructions: selectedPrescription.instructions || ''
                                            });
                                            setIsEditing(true);
                                        }}
                                    >
                                        {t('edit') || 'Editar'}
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={() => setSelectedPrescription(null)}>{t('close')}</button>
                            </>
                        )}
                    </div>
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
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    value={editData.medications}
                                    onChange={e => setEditData({ ...editData, medications: e.target.value })}
                                />
                            ) : (
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedPrescription.medications}</pre>
                            )}
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label className="input-label">{t('instructions_notes')}</label>
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="2"
                                    value={editData.instructions}
                                    onChange={e => setEditData({ ...editData, instructions: e.target.value })}
                                />
                            ) : (
                                <div style={{ padding: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    {selectedPrescription.instructions || t('none')}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* License Detail Modal */}
            <Modal
                isOpen={!!selectedLicense}
                onClose={() => {
                    setSelectedLicense(null);
                    setIsEditing(false);
                }}
                title={t('license_details') || 'Detalles de Licencia'}
                footer={
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleUpdateLicense}>{t('save') || 'Guardar Changes'}</button>
                            </>
                        ) : (
                            <>
                                {(user.role === 'admin' || user.role === 'secretary' || (user.role === 'doctor' && myDoctorProfile?.id === selectedLicense?.doctor_id)) && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setLicenseEditData({
                                                start_date: selectedLicense.start_date ? selectedLicense.start_date.split('T')[0] : '',
                                                days_duration: selectedLicense.days_duration,
                                                diagnosis: selectedLicense.diagnosis
                                            });
                                            setIsEditing(true);
                                        }}
                                    >
                                        {t('edit') || 'Editar'}
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={() => setSelectedLicense(null)}>{t('close')}</button>
                            </>
                        )}
                    </div>
                }
            >
                {selectedLicense && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">{t('start_date') || 'Fecha de Inicio'}</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={licenseEditData.start_date}
                                        onChange={e => setLicenseEditData({ ...licenseEditData, start_date: e.target.value })}
                                    />
                                ) : (
                                    <div className="p-2 border rounded bg-slate-50">{new Date(selectedLicense.start_date).toLocaleDateString()}</div>
                                )}
                            </div>
                            <div>
                                <label className="input-label">{t('days_duration') || 'Días de Duración'}</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={licenseEditData.days_duration}
                                        onChange={e => setLicenseEditData({ ...licenseEditData, days_duration: e.target.value })}
                                    />
                                ) : (
                                    <div className="p-2 border rounded bg-slate-50">{selectedLicense.days_duration} {t('days')}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="input-label">{t('diagnosis') || 'Diagnóstico'}</label>
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    value={licenseEditData.diagnosis}
                                    onChange={e => setLicenseEditData({ ...licenseEditData, diagnosis: e.target.value })}
                                />
                            ) : (
                                <div className="p-3 border rounded bg-slate-50 italic">
                                    "{selectedLicense.diagnosis}"
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-main-500 border-t pt-4">
                            <p><strong>{t('patient')}:</strong> {selectedLicense.patient_name}</p>
                            <p><strong>{t('doctor')}:</strong> {selectedLicense.doctor_name}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Request Detail Modal (Editing from History) */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => {
                    setSelectedRequest(null);
                    setIsEditing(false);
                }}
                title={selectedRequest?.type === 'prescription' ? t('prescription_details') : (selectedRequest?.type === 'certificate' ? (t('certificate_details') || 'Detalles de Certificado') : t('license_details'))}
                footer={
                    <div className="flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleUpdateRequest}>{t('save')}</button>
                            </>
                        ) : (
                            <>
                                {(user.role === 'admin' || user.role === 'secretary' || (user.role === 'doctor' && (user.user_id || user.id) === selectedRequest?.doctor_user_id)) && (
                                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>{t('edit')}</button>
                                )}
                                <button className="btn btn-primary" onClick={() => setSelectedRequest(null)}>{t('close')}</button>
                            </>
                        )}
                    </div>
                }
            >
                {selectedRequest && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="input-label">{selectedRequest.type === 'prescription' ? t('medications') : (selectedRequest.type === 'certificate' ? (t('description') || 'Descripción') : t('diagnosis'))}</label>
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    value={requestEditData.request_note}
                                    onChange={e => setRequestEditData({ ...requestEditData, request_note: e.target.value })}
                                />
                            ) : (
                                <div className="p-3 border rounded bg-slate-50 italic whitespace-pre-wrap">
                                    "{selectedRequest.request_note}"
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="input-label">{t('doctor_says')}</label>
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="2"
                                    value={requestEditData.doctor_note}
                                    onChange={e => setRequestEditData({ ...requestEditData, doctor_note: e.target.value })}
                                />
                            ) : (
                                <div className="p-3 border rounded bg-slate-50">
                                    {selectedRequest.doctor_note || t('none')}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-main-500 border-t pt-4">
                            <p><strong>{t('patient')}:</strong> {selectedRequest.patient_name}</p>
                            <p><strong>{t('doctor')}:</strong> {selectedRequest.doctor_name}</p>
                            <p><strong>Status:</strong> <span className="tag tag-green tag-sm">{t(selectedRequest.status)}</span></p>

                            {(user.role === 'secretary' || user.role === 'admin') && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                    <label className="input-label">Valor (Deuda/Costo)</label>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                className="input-field w-32"
                                                value={requestEditData.debt_amount}
                                                onChange={e => setRequestEditData({ ...requestEditData, debt_amount: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ) : (
                                        <p className="font-bold text-main-700">
                                            {selectedRequest.debt_amount ? `$${selectedRequest.debt_amount}` : '$0.00'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default MedicalDocuments;
