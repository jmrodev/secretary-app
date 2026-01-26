
import React from 'react';
import { useMedicalDocumentsController } from '../controllers/useMedicalDocumentsController';

// Components
import Sidebar from '../components/organisms/Sidebar';
import Modal from '../components/molecules/Modal';
import TransactionModal from '../components/molecules/TransactionModal';
import PatientSearchSelect from '../components/molecules/PatientSearchSelect';
import MedicalRequestForm from '../components/organisms/MedicalRequestForm';
import MedicalRequestList from '../components/organisms/MedicalRequestList';
import MedicalHistoryTable from '../components/organisms/MedicalHistoryTable';
import MedicationAutocomplete from '../components/molecules/MedicationAutocomplete';
import Button from '../components/atoms/Button';

// Utils
import { timeAgo } from '../utils/time';

const MedicalDocuments = () => {
    const controller = useMedicalDocumentsController();
    const {
        user, t, activeTab, setActiveTab, requestsSubTab, setRequestsSubTab,
        searchTerm, setSearchTerm, isEditing, setIsEditing,
        requests, files, prescriptions, licenses, doctors,
        selectedPatient, selectedDoctor,
        selectedFile, setSelectedFile, selectedPrescription, setSelectedPrescription,
        selectedLicense, setSelectedLicense, selectedRequest, setSelectedRequest,
        reqType, setReqType, reqNote, setReqNote, bonified, setBonified,
        sendToDoctor, setSendToDoctor, filePatient, setFilePatient, fileDesc, setFileDesc,
        fileToDelete, setFileToDelete, actionModal, setActionModal, actionNote, setActionNote,
        paymentModal, setPaymentModal, editData, setEditData, licenseEditData, setLicenseEditData,
        requestEditData, setRequestEditData,

        // Handlers
        filterItem, handleCreateRequest, handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleDeleteLicense, fetchRequests, fetchFiles
    } = controller;

    // --- Derived Data for Combined Views ---
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
            setEditData({ medications: item.medications || '', instructions: item.instructions || '' });
        } else if (item._origin === 'license') {
            setSelectedLicense(item);
            setLicenseEditData({ start_date: item.start_date || '', days_duration: item.days_duration || '', diagnosis: item.diagnosis || '' });
        } else if (item._origin === 'request') {
            setSelectedRequest(item);
            setRequestEditData({
                request_note: item.request_note || '',
                doctor_note: item.doctor_note || '',
                debt_amount: item.debt_amount || ''
            });
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('medical_documents')}</h1>
                        <p className="page-header__subtitle">{t('medical_docs_subtitle') || 'Gestione requerimientos, archivos e historial de pacientes en un solo lugar.'}</p>
                    </div>
                </header>

                <nav className="tab-nav">
                    {['requests', 'files', 'prescriptions', 'licenses', 'certificates'].map(tab => (
                        <Button
                            key={tab}
                            variant="ghost"
                            onClick={() => setActiveTab(tab)}
                            className={`tab-nav__item ${activeTab === tab ? 'tab-nav__item--active' : ''}`}
                        >
                            <span className="tab-nav__icon">
                                {tab === 'requests' ? '⚡' : tab === 'files' ? '📂' : tab === 'prescriptions' ? '💊' : tab === 'licenses' ? '📄' : '📜'}
                            </span>
                            <span className="tab-nav__label">
                                {tab === 'requests' ? t('requests_workflow') : tab === 'files' ? t('file_repository') : tab === 'prescriptions' ? t('prescriptions') : tab === 'licenses' ? t('medical_licenses') : (t('certificates') || 'Certificados')}
                            </span>
                        </Button>
                    ))}
                </nav>

                <div className="search-box">
                    <div className="search-box__wrapper">
                        <span className="search-box__icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('search_docs_placeholder')}
                            className="search-box__input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {activeTab === 'requests' && (
                    <div className="requests-container">
                        <div className="sub-tab-nav">
                            <Button
                                variant="ghost"
                                onClick={() => setRequestsSubTab('list')}
                                className={`sub-tab-nav__item ${requestsSubTab === 'list' ? 'sub-tab-nav__item--active' : ''}`}
                            >
                                📋 {t('request_status')}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setRequestsSubTab('new')}
                                className={`sub-tab-nav__item ${requestsSubTab === 'new' ? 'sub-tab-nav__item--active' : ''}`}
                            >
                                ➕ {t('new_request')}
                            </Button>
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
                            <div className="card animate-fadeIn">
                                <header className="card-header">
                                    <h3 className="card-header__title">{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
                                </header>
                                <MedicalRequestList
                                    requests={requests}
                                    filterItem={filterItem}
                                    handleDeleteRequest={handleDeleteRequest}
                                    openActionModal={(type, id) => setActionModal({ open: true, type, id })}
                                    setPaymentModal={setPaymentModal}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="files-grid">
                        <section className="card">
                            <h3 className="card__title">{t('upload_document')}</h3>
                            <form className="file-upload-form" onSubmit={handleFileUpload}>
                                <div className="input-group">
                                    <label className="input-label">{t('patient_label')}</label>
                                    <PatientSearchSelect value={filePatient} onChange={setFilePatient} placeholder={t('select_patient')} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('description')}</label>
                                    <input className="input-field" value={fileDesc} onChange={e => setFileDesc(e.target.value)} placeholder="e.g. Lab Results PDF" required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('file')}</label>
                                    <input type="file" className="input-field" onChange={e => setSelectedFile(e.target.files[0])} required />
                                </div>
                                <Button type="submit" className="w-full">{t('upload_file')}</Button>
                            </form>
                        </section>

                        <section className="card">
                            <h3 className="card__title">{t('file_repository')}</h3>
                            <div className="file-list">
                                {files.filter(filterItem).length === 0 ? <p className="text-muted">{t('no_files')}</p> : (
                                    <div className="table-responsive">
                                        <table className="table-base">
                                            <thead>
                                                <tr>
                                                    <th>{t('file')}</th>
                                                    <th>{t('patient')}</th>
                                                    <th className="text-right">{t('actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {files.filter(filterItem).map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.open(f.file_url, '_blank')}>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <span>📄</span>
                                                                <span className="font-bold">{f.description || f.file_name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{f.patient_name}</td>
                                                        <td className="text-right">
                                                            {(user.role === 'admin' || user.role === 'secretary') && (
                                                                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setFileToDelete(f); }}>🗑️</Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <MedicalHistoryTable
                        items={combinedPrescriptions}
                        filterItem={filterItem}
                        onView={handleViewItem}
                        onDelete={handleDeletePrescription}
                        icon="💊"
                        title={t('recent_prescriptions')}
                    />
                )}

                {activeTab === 'licenses' && (
                    <MedicalHistoryTable
                        items={combinedLicenses}
                        filterItem={filterItem}
                        onView={handleViewItem}
                        onDelete={handleDeleteLicense}
                        icon="📄"
                        title={t('recent_licenses')}
                    />
                )}

                {activeTab === 'certificates' && (
                    <MedicalHistoryTable
                        items={combinedCertificates}
                        filterItem={filterItem}
                        onView={handleViewItem}
                        onDelete={(id, item) => handleDeleteRequest(id, item)}
                        icon="📜"
                        title={t('recent_certificates')}
                        originLabel={t('certificate')}
                    />
                )}
            </main>

            {/* --- Modals --- */}
            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={actionModal.type === 'completed' ? t('approve_request') : t('reject_request')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>{t('cancel')}</Button>
                        <Button onClick={() => handleUpdateStatus(actionModal.id, actionModal.type, actionNote)}>{actionModal.type === 'completed' ? t('approve') : t('reject')}</Button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">{actionModal.type === 'completed' ? t('message_optional') : t('reason_rejection')}</label>
                    <textarea className="input-field" rows="3" value={actionNote} onChange={e => setActionNote(e.target.value)} autoFocus />
                </div>
            </Modal>

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                requestId={paymentModal.reqId}
                onSuccess={fetchRequests}
            />

            <Modal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                title={t('confirm_delete')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setFileToDelete(null)}>{t('cancel')}</Button>
                        <Button variant="danger" onClick={confirmFileDelete}>{t('delete')}</Button>
                    </>
                }
            >
                <p>¿Seguro que desea eliminar el archivo <strong>{fileToDelete?.file_name}</strong>?</p>
            </Modal>
        </div>
    );
};

export default MedicalDocuments;
