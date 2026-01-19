import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useModal } from '../context/ModalContext';

import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import CurrencyInput from '../components/CurrencyInput';
import PatientForm from '../components/PatientForm';
import QRCodeModal from '../components/QRCodeModal';


const Patients = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { alert, confirm, doubleConfirm } = useModal();
    const { settings } = useConfig();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [insurances, setInsurances] = useState([]);

    // View Details State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [details, setDetails] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);



    // Creation Form State
    const [showCreate, setShowCreate] = useState(false);
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

    // Recycle Bin State
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'recycle'
    const [recycleItems, setRecycleItems] = useState([]);
    const [showRecycleDetail, setShowRecycleDetail] = useState(null);

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [qrExpiry, setQrExpiry] = useState(null);
    const [showRatingInfo, setShowRatingInfo] = useState(false);

    const handleGenerateQR = async (patientId = null) => {
        try {
            const res = await api.post('/temp-access/generate', { patientId });
            const baseUrl = settings.public_base_url || window.location.origin;
            const fullUrl = `${baseUrl}${res.data.url}`;
            setQrUrl(fullUrl);
            setQrExpiry(res.data.expiresAt);
            setQrModalOpen(true);
        } catch (err) {
            console.error('Error in handleGenerateQR:', err);
            showMessage('Error generating QR code: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSavePrescription = async () => {
        if (!prescribeModal.medications.trim()) {
            showMessage(t('please_enter_meds'), 'warning');
            return;
        }
        try {
            await api.post('/medical/prescriptions', {
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
            showMessage(t('failed_load_patients') || "Error al cargar la lista de pacientes.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInsurances = async () => {
        try {
            const res = await api.get('/insurances');
            setInsurances(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRecycleBin = async () => {
        if (user.role !== 'admin' && user.role !== 'secretary') return;
        try {
            const res = await api.get('/logs/recycle-bin');
            setRecycleItems(res.data);
        } catch (err) {
            console.error("Failed to fetch recycle bin", err);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
        fetchInsurances();
        fetchRecycleBin();
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
        if (!total || total === 0) return 5;
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
            setPatients(prev => prev.map(p =>
                p.id === patientId ? { ...p, behavior_rating: newRating } : p
            ));
        } catch (err) {
            console.error("Failed to update behavior rating", err);
        }
    };

    const handleToggleNewPatient = async (patientId) => {
        try {
            const res = await api.put(`/users/patients/${patientId}/toggle-new`);
            const { is_new_patient, marked_new_at } = res.data;
            setPatients(prev => prev.map(p =>
                p.id === patientId ? { ...p, is_new_patient, marked_new_at } : p
            ));
            if (details && details.id === patientId) {
                setDetails(prev => ({ ...prev, is_new_patient, marked_new_at }));
            }
            showMessage(is_new_patient ? 'Marcado como Nuevo Paciente' : 'Desmarcado como Nuevo Paciente', 'success');
        } catch (err) {
            console.error("Failed to toggle new patient status", err);
            showMessage("Error al actualizar estado de nuevo paciente", 'error');
        }
    };

    const normalizedSearch = normalizeText(searchTerm).trim();
    const trimmedSearch = searchTerm.trim();

    const searchTokens = normalizedSearch.split(/\s+/).filter(t => t.length > 0);

    const filteredPatients = patients.filter(p => {
        const searchText = normalizeText(
            [
                p.full_name,
                p.first_name,
                p.last_name,
                p.dni,
                p.insurance,
                p.insurance_name,
                p.affiliate_number,
                p.email,
                p.phone,
                p.phone ? p.phone.replace(/[^0-9]/g, '') : ''
            ].filter(Boolean).join(' ')
        );

        return searchTokens.every(token => searchText.includes(token));
    }).sort((a, b) => {
        const debtA = Number(a.total_debt) || 0;
        const debtB = Number(b.total_debt) || 0;
        if (debtA > 0 && debtB === 0) return -1;
        if (debtA === 0 && debtB > 0) return 1;
        if (debtA > 0 && debtB > 0) return debtB - debtA;
        return a.full_name.localeCompare(b.full_name);
    });

    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSendEditLink = async (patient) => {
        if (!patient.phone) {
            showMessage('El paciente no tiene teléfono registrado', 'error');
            return;
        }

        try {
            const res = await api.post('/temp-access/generate', { patientId: patient.id });
            const relativeUrl = res.data.url;

            // Construct full URL using public_base_url (Cloudflare) or fallback to origin
            const baseUrl = settings.public_base_url || window.location.origin;
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const fullUrl = `${cleanBase}${relativeUrl}`;

            let messageTemplate = settings.temp_access_message_template;
            // Fallback default if setting is empty or missing
            if (!messageTemplate || !messageTemplate.trim()) {
                messageTemplate = "Hola {name}, por favor actualiza tus datos en el siguiente enlace: {link}";
            }

            // If patient doesn't have assignedDoctors (e.g. from list view), fetch them
            let assignedDocs = patient.assignedDoctors;
            if (!assignedDocs) {
                try {
                    const detailRes = await api.get(`/users/patients/${patient.id}`);
                    assignedDocs = detailRes.data.assignedDoctors;
                } catch (e) {
                    console.error("Could not fetch details for doc name", e);
                    assignedDocs = [];
                }
            }

            const doctorName = (assignedDocs && assignedDocs.length > 0)
                ? assignedDocs.map(d => d.full_name).join(' / ')
                : (user.role === 'doctor' ? user.name : 'su médico');

            const message = messageTemplate
                .replace(/{name}/g, patient.full_name)
                .replace(/{link}/g, fullUrl)
                .replace(/{doctor_name}/g, doctorName)
                .replace(/{secretary_name}/g, user.name || 'Secretaria');

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const phone = patient.phone.replace(/[^0-9]/g, '');

            let targetUrl;
            if (isMobile) {
                targetUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            } else {
                targetUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
            }

            window.open(targetUrl, '_blank');
            showMessage('Enlace generado. Abriendo WhatsApp...', 'success');

        } catch (err) {
            console.error(err);
            showMessage('Error al generar el enlace', 'error');
        }
    };

    const handleCreate = async (formData) => {
        try {
            await api.post('/auth/register', { ...formData, role: 'patient' });
            showMessage(t('patient_created'), 'success');
            setShowCreate(false);
            fetchPatients();
        } catch (err) {
            const msg = err.response?.data || t('failed_create_patient');
            showMessage(msg, 'error');
            console.error(err);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            setViewLoading(true);
            setSelectedPatient(id);
            if (selectedPatient !== id) {
                setDetails(null);
            }
            const [info, trans] = await Promise.all([
                api.get(`/users/patients/${id}`),
                api.get(`/finances/transactions?patient_id=${id}`)
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
            first_name: details.first_name || '',
            last_name: details.last_name || '',
            dni: details.dni || '',
            phone: details.phone || '',
            insurance_id: details.insurance_id || '',
            affiliate_number: details.affiliate_number || (details.insurance && !details.insurance_id ? details.insurance : '') || '',
            email: details.email || '',
            dob: details.dob ? details.dob.split('T')[0] : '',
            medical_history: details.medical_history || '',
            tariff_percent: details.tariff_percent || 0,
            tariff_override: details.tariff_override || '',
            assignedDoctors: details.assignedDoctors ? details.assignedDoctors.map(d => d.id) : [],
            visit_interval_days: details.visit_interval_days || '',
            prescription_interval_days: details.prescription_interval_days || '',
            next_suggested_visit_date: details.next_suggested_visit_date ? details.next_suggested_visit_date.split('T')[0] : '',
            next_suggested_prescription_date: details.next_suggested_prescription_date ? details.next_suggested_prescription_date.split('T')[0] : '',
            license_expiry_date: details.license_expiry_date ? details.license_expiry_date.split('T')[0] : '',
            institution_id: details.institution_id || ''
        });
        setEditModalOpen(true);
    };

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
            fetchPatients();
            if (selectedPatient === debtParams.patientId) {
                handleViewDetails(selectedPatient);
            }
        } catch (err) {
            console.error(err);
            showMessage(t('payment_failed'), 'error');
        }
    };


    const handleDeletePatient = async (patientData) => {
        if (!patientData || !patientData.user_id) {
            showMessage("Error: No se pudo identificar al usuario.", 'error');
            return;
        }

        const isConfirmed = await doubleConfirm(
            `¿Estás seguro de que deseas eliminar al paciente ${patientData.full_name}? esta acción moverá sus datos a la Papelera.`,
            `¡AVISO! El paciente ${patientData.full_name} será eliminado del listado activo. ¿Deseas continuar con la eliminación?`,
            "Confirmar Eliminación",
            "Segunda Verificación"
        );

        if (!isConfirmed) return;

        try {
            // Delete user by their USER ID (not patient ID)
            await api.delete(`/users/admin/users/${patientData.user_id}`);
            showMessage('Paciente eliminado y movido a la papelera.', 'success');

            // Close details and refresh list
            setSelectedPatient(null);
            setDetails(null);
            fetchPatients();
            fetchRecycleBin();
        } catch (err) {
            console.error(err);
            showMessage('Error al eliminar paciente: ' + (err.response?.data?.message || err.message), 'error');
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
                            <div className="flex gap-2">
                                {user.role === 'secretary' && (
                                    <button
                                        className={`btn btn-sm flex items-center gap-2 ${details.is_new_patient ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleToggleNewPatient(details.id)}
                                    >
                                        {details.is_new_patient ? '✨ NUEVO' : '👤 EXISTENTE'}
                                    </button>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={() => handleGenerateQR(details.id)}>📱 QR</button>
                                <button className="btn btn-secondary btn-sm" onClick={handleEditClick}>✏️ {t('edit_info')}</button>
                                {(user.role === 'admin' || user.role === 'secretary') && (
                                    <button
                                        className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 border-red-200"
                                        onClick={() => handleDeletePatient(details)}
                                        title="Eliminar Paciente"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="patient-info-grid">
                            <p><strong>{t('dni')}:</strong> {details.dni || 'N/A'}</p>
                            <p><strong>OS:</strong> {details.insurance_name || 'N/A'}</p>
                            <p><strong>{t('assigned_doctors')}:</strong> {details.assignedDoctors && details.assignedDoctors.length > 0 ? details.assignedDoctors.map(d => d.full_name).join(', ') : t('none')}</p>
                            <p><strong>Phone:</strong> {details.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {details.email || 'N/A'}</p>
                            <p><strong>{t('dob')}:</strong> {details.dob ? new Date(details.dob).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <h3>{t('financial_history_debt')}</h3>
                        <div className="debt-summary-box mt-4">
                            <div><strong>{t('total_debt')}: </strong> <span className="debt-amount-highlight">${Number(details.total_debt).toFixed(2)}</span></div>
                            {Number(details.total_debt) > 0 && (
                                <button className="btn btn-primary" onClick={(e) => openDebtModal(e, details.id, details.total_debt)}>💸 {t('pay_debt')}</button>
                            )}
                        </div>
                    </div>

                    <Modal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        title="Edit Patient Details"
                        size="lg"
                    >
                        <PatientForm
                            initialValues={editData}
                            onSubmit={async (data) => {
                                try {
                                    await api.put(`/users/patients/${details.id}`, data);
                                    setEditModalOpen(false);
                                    showMessage(t('patient_updated'), 'success');
                                    handleViewDetails(details.id);
                                    fetchPatients();
                                } catch (err) {
                                    console.error(err);
                                    showMessage(t('failed_update_patient'), 'error');
                                }
                            }}
                            onCancel={() => setEditModalOpen(false)}
                            isEdit={true}
                            isAdmin={true}
                            insurances={insurances}
                            doctors={doctors}
                        />
                    </Modal>

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
                        <div className="flex flex-col gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('amount')} ($)</label>
                                <CurrencyInput className="input-field" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('payment_method')}</label>
                                <select className="input-field" value={debtParams.method} onChange={e => setDebtParams({ ...debtParams, method: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="debit_card">Debit Card</option>
                                </select>
                            </div>
                        </div>
                    </Modal>

                    <QRCodeModal
                        isOpen={qrModalOpen}
                        onClose={() => setQrModalOpen(false)}
                        url={qrUrl}
                        expiresAt={qrExpiry}
                    />

                    <Modal
                        isOpen={showRatingInfo}
                        onClose={() => setShowRatingInfo(false)}
                        title={t('rating_guide_title')}
                    >
                        <div className="p-2">
                            <p className="whitespace-pre-line text-slate-600">
                                {t('rating_guide_body')}
                            </p>
                            <div className="mt-6 flex justify-end">
                                <button className="btn btn-primary" onClick={() => setShowRatingInfo(false)}>{t('close')}</button>
                            </div>
                        </div>
                    </Modal>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Tabs matching Appointments style */}
                <div className="top-nav-tabs mb-6">
                    <div className="tabs-container" style={{ margin: 0 }}>
                        <button
                            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                            onClick={() => setActiveTab('list')}
                        >
                            📋 Lista Activa
                        </button>
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'recycle' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('recycle'); fetchRecycleBin(); }}
                            >
                                🗑️ Papelera
                                {recycleItems.length > 0 && <span className="ml-2 bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full text-xs">{recycleItems.length}</span>}
                            </button>
                        )}
                    </div>
                </div>

                <div className="header-actions-container mb-6">
                    <div className="flex-between w-full gap-4">
                        {/* Search Bar - Main Filter */}
                        {activeTab === 'list' && (
                            <div className="flex-1 relative" style={{ maxWidth: '600px' }}>
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder') || "Buscar por nombre, DNI, teléfono..."}
                                    className="input-field w-full"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <span className="search-stats absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs bg-white px-2">
                                    {filteredPatients.length} resultados
                                </span>
                            </div>
                        )}

                        {/* Spacer if no search */}
                        {activeTab !== 'list' && <div className="flex-1"></div>}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setLoading(true); fetchPatients(); fetchRecycleBin(); }}
                                className="btn btn-secondary btn-sm-icon"
                                title={t('refresh_list') || 'Refresh'}
                            >
                                🔄
                            </button>
                            <button
                                onClick={() => setShowRatingInfo(true)}
                                className="btn btn-secondary btn-sm-icon"
                                title="Guía de Calificaciones"
                            >
                                ℹ️
                            </button>
                            {user.role === 'secretary' && activeTab === 'list' && (
                                <button className="btn btn-primary flex items-center gap-2 px-6 py-2 shadow-sm font-bold" onClick={() => setShowCreate(!showCreate)}>
                                    {showCreate ? `❌ ${t('cancel')}` : `✨ ${t('new') || 'Nuevo'}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>



                {
                    showCreate && (
                        <div className="card mb-8 animate-fadeInDown">
                            <div className="flex-between mb-4">
                                <h3>{t('register_new_patient')}</h3>
                                <button className="btn-close" onClick={() => setShowCreate(false)}>✕</button>
                            </div>
                            <PatientForm
                                onSubmit={handleCreate}
                                isEdit={false}
                                isAdmin={true}
                                insurances={insurances}
                                doctors={doctors}
                            />
                        </div>
                    )
                }

                {
                    activeTab === 'list' ? (
                        <>
                            <div className="card-transparent">
                                <ul className="item-grid">
                                    {currentPatients.length === 0 ? (
                                        <li className="text-muted p-12 text-center bg-white rounded-lg border border-dashed border-slate-300">
                                            {t('no_patients_found')}
                                        </li>
                                    ) : (
                                        currentPatients.map(p => (
                                            <li key={p.id} className="item-card hover:shadow-lg transition-all border border-slate-100 p-4 bg-white rounded-xl shadow-sm mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <strong className="text-lg text-slate-800 capitalize leading-tight">{p.full_name}</strong>
                                                        {p.is_new_patient === 1 && <span className="badge badge-purple uppercase text-[10px]">✨ NUEVO</span>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                                        {p.dni && <span><span className="font-semibold text-slate-400">DNI:</span> {p.dni}</span>}
                                                        {(p.insurance_name || p.insurance) && <span><span className="font-semibold text-slate-400">OS:</span> {p.insurance_name || p.insurance}</span>}
                                                        {p.phone && (
                                                            <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline" onClick={(e) => e.stopPropagation()}>
                                                                📱 {p.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                    {Number(p.total_debt) > 0 && (
                                                        <div
                                                            onClick={(e) => openDebtModal(e, p.id, p.total_debt)}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 cursor-pointer hover:bg-red-200 transition-colors"
                                                        >
                                                            💸 Deuda: ${p.total_debt}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center flex-wrap gap-4 mr-6">
                                                    <div className="rating-container flex flex-col items-center" title={`${t('rating_financial_tooltip')}\nDeuda Actual: $${p.total_debt}`}>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">FIN</div>
                                                        <div className="rating-stars-gold text-base">
                                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateFinancialRating(Number(p.total_debt)) ? '★' : '☆'}</span>)}
                                                        </div>
                                                    </div>
                                                    <div className="rating-container flex flex-col items-center" title={`${t('rating_attendance_tooltip')}\nResumen: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">ASIST</div>
                                                        <div className="rating-stars-blue text-base">
                                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateAttendanceRating(p.total_appointments, p.missed_appointments) ? '★' : '☆'}</span>)}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="rating-container flex flex-col items-center cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                                                        onClick={() => handleBehaviorRatingChange(p.id, ((p.behavior_rating || 5) % 5) + 1)}
                                                        title={`${t('rating_behavior_tooltip')}\nCalificación: ${p.behavior_rating || 5}/5 (Click para cambiar)`}
                                                    >
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">COND</div>
                                                        <div className="rating-stars-pink text-base">
                                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= (p.behavior_rating || 5) ? '★' : '☆'}</span>)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        className="btn btn-secondary btn-sm px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendEditLink(p);
                                                        }}
                                                        title="Enviar Link de Edición (WhatsApp)"
                                                    >
                                                        🔗 Link Edición
                                                    </button>
                                                    <button className="btn btn-primary btn-sm px-4" onClick={() => handleViewDetails(p.id)}>
                                                        🩺 Ver Ficha
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-10 mb-6">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="btn btn-secondary btn-sm"
                                        style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
                                    >
                                        ← Anterior
                                    </button>
                                    <span className="px-6 py-2 bg-white rounded-full text-sm font-bold text-slate-500 border border-slate-200 shadow-sm">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-secondary btn-sm"
                                        style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="recycle-bin-view mt-6">
                            <div className="alert alert-info mb-6 shadow-sm border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                                <span className="text-xl">ℹ️</span>
                                <span className="font-medium">Los elementos aquí listados se eliminan permanentemente tras 30 días.</span>
                            </div>
                            <ul className="item-grid">
                                {recycleItems.length === 0 ? (
                                    <li className="text-muted p-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                        <div className="text-5xl opacity-20 mb-4">🗑️</div>
                                        <p className="text-lg font-bold text-slate-400">La papelera está vacía.</p>
                                    </li>
                                ) : (
                                    recycleItems.map(item => (
                                        <li key={item.id} className="item-card border-l-4 border-l-purple-500 hover:bg-slate-50 transition-all shadow-sm p-4 bg-white rounded-xl mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {item.entity_type !== 'patient' && (
                                                        <span className="badge badge-purple uppercase text-[10px] font-black tracking-widest px-2">
                                                            {item.entity_type === 'doctor' ? 'MÉDICO' : 'SECRETARIA'}
                                                        </span>
                                                    )}
                                                    <strong className="text-lg text-slate-800 leading-tight">{item.entity_name}</strong>
                                                </div>
                                                <div className="flex flex-col gap-1 text-sm text-slate-500">
                                                    <span>📅 Eliminado el <span className="font-bold text-slate-600">{new Date(item.deleted_at).toLocaleString()}</span></span>
                                                    <span>👤 Por <span className="font-bold text-slate-600">{item.deleted_by_name}</span></span>
                                                </div>
                                                <div className="text-[11px] text-red-500 mt-3 font-bold bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">
                                                    ⚠️ EXPIRA EL {new Date(item.expires_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm text-green-600 bg-green-50 hover:bg-green-100 border-green-200"
                                                    onClick={async () => {
                                                        if (await confirm(`¿Restaurar a ${item.entity_name}?\n\nLa contraseña se reseteará a '123456'.`)) {
                                                            try {
                                                                await api.post(`/logs/restore/${item.id}`);
                                                                showMessage('Restaurado con éxito', 'success');
                                                                fetchRecycleBin();
                                                                // Optional: Switch to list tab to see it
                                                                // setActiveTab('list');
                                                            } catch (err) {
                                                                console.error(err);
                                                                showMessage('Error al restaurar', 'error');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    ♻️ Restaurar
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm flex items-center gap-2 px-4 shadow-sm"
                                                    onClick={() => setShowRecycleDetail(item)}
                                                >
                                                    👁️ Ver Datos
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )
                }

                {/* Modals placed correctly inside main content */}
                <Modal
                    isOpen={!!showRecycleDetail}
                    onClose={() => setShowRecycleDetail(null)}
                    title={`📜 Respaldo: ${showRecycleDetail?.entity_name}`}
                    size="lg"
                >
                    {showRecycleDetail && (
                        <div className="p-6 bg-slate-900 text-green-400 font-mono text-xs rounded-xl shadow-2xl overflow-auto max-h-500 border border-slate-800">
                            <pre className="leading-relaxed opacity-90">{JSON.stringify(JSON.parse(showRecycleDetail.data), null, 4)}</pre>
                        </div>
                    )}
                </Modal>

                <Modal
                    isOpen={debtModalOpen}
                    onClose={() => setDebtModalOpen(false)}
                    title={`💸 ${t('pay_debt')}`}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setDebtModalOpen(false)}>{t('cancel')}</button>
                            <button className="btn btn-primary px-8 font-bold" onClick={handlePayDebt}>{t('confirm_payment')}</button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-6 p-2">
                        <p className="text-slate-600 font-medium">{t('enter_payment_amount') || 'Ingrese el monto a pagar:'}</p>
                        <div className="input-group">
                            <label className="input-label text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{t('amount')} ($)</label>
                            <CurrencyInput className="input-field text-xl font-bold bg-slate-50 border-slate-200" value={debtParams.amount} onChange={e => setDebtParams({ ...debtParams, amount: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{t('payment_method')}</label>
                            <select className="input-field bg-slate-50 border-slate-200" value={debtParams.method} onChange={e => setDebtParams({ ...debtParams, method: e.target.value })}>
                                <option value="cash">💵 Cash</option>
                                <option value="transfer">🏦 Transfer</option>
                                <option value="credit_card">💳 Credit Card</option>
                                <option value="debit_card">💰 Debit Card</option>
                            </select>
                        </div>
                    </div>
                </Modal>

                <QRCodeModal
                    isOpen={qrModalOpen}
                    onClose={() => setQrModalOpen(false)}
                    url={qrUrl}
                    expiresAt={qrExpiry}
                />
            </main >
        </div >
    );
};

export default Patients;
