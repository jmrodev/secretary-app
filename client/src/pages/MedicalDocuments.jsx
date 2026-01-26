
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
import CurrencyInput from '../components/atoms/CurrencyInput';
import Button from '../components/atoms/Button';

// Utils
import { timeAgo } from '../utils/time';

const MedicalDocuments = () => {
    const controller = useMedicalDocumentsController();
    const {
        user, t, activeTab, setActiveTab, requestsSubTab, setRequestsSubTab,
        searchTerm, setSearchTerm, isEditing, setIsEditing,
        requests, files, prescriptions, licenses, doctors,
        selectedFile, setSelectedFile, selectedPrescription, setSelectedPrescription,
        selectedLicense, setSelectedLicense, selectedRequest, setSelectedRequest,
        filePatient, setFilePatient, fileDesc, setFileDesc,
        fileToDelete, setFileToDelete, actionModal, setActionModal, actionNote, setActionNote,
        paymentModal, setPaymentModal, editData, setEditData, licenseEditData, setLicenseEditData,
        requestEditData, setRequestEditData,

        // Handlers
        filterItem, handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleDeleteLicense, fetchRequests
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

    const handleEditItem = (item) => {
        if (item._origin === 'prescription') {
            setEditData({ medications: item.medications, instructions: item.instructions });
            setSelectedPrescription(item);
            setIsEditing(true);
        } else if (item._origin === 'license') {
            setLicenseEditData({ start_date: item.start_date, days_duration: item.days_duration, diagnosis: item.diagnosis });
            setSelectedLicense(item);
            setIsEditing(true);
        } else if (item._origin === 'request') {
            setRequestEditData({ request_note: item.request_note, doctor_note: item.doctor_note, debt_amount: item.debt_amount || 0 });
            setSelectedRequest(item);
            setIsEditing(true);
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

                <nav className="tab-nav mb-8">
                    {[
                        { id: 'requests', label: t('requests_workflow'), icon: '⚡' },
                        { id: 'files', label: t('file_repository'), icon: '📂' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: '💊' },
                        { id: 'licenses', label: t('medical_licenses'), icon: '📄' },
                        { id: 'certificates', label: t('certificates') || 'Certificados', icon: '📜' }
                    ].map(tab => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-nav__item ${activeTab === tab.id ? 'tab-nav__item--active' : ''}`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </Button>
                    ))}
                </nav>

                <section className="action-bar mb-8">
                    <div className="action-bar__search">
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
                </section>

                <div className="tab-content animate-fadeIn">
                    {activeTab === 'requests' && (
                        <div className="flex flex-col gap-6">
                            <nav className="tab-nav tab-nav--sub mb-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setRequestsSubTab('list')}
                                    className={`tab-nav__item ${requestsSubTab === 'list' ? 'tab-nav__item--active' : ''}`}
                                >
                                    📋 {t('request_status')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setRequestsSubTab('new')}
                                    className={`tab-nav__item ${requestsSubTab === 'new' ? 'tab-nav__item--active' : ''}`}
                                >
                                    ➕ {t('new_request')}
                                </Button>
                            </nav>

                            {requestsSubTab === 'new' ? (
                                <MedicalRequestForm
                                    doctors={doctors}
                                    onRequestCreated={() => {
                                        fetchRequests();
                                        setRequestsSubTab('list');
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <h3 className="section-title mb-0">{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <section className="lg:col-span-1">
                                <div className="card">
                                    <header className="card-header border-b-0 mb-4">
                                        <h3 className="card-header__title">{t('upload_document')}</h3>
                                    </header>
                                    <form className="flex flex-col gap-4" onSubmit={handleFileUpload}>
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
                                </div>
                            </section>

                            <section className="lg:col-span-2">
                                <div className="card p-0 overflow-hidden">
                                    <header className="card-header border-b mb-0 p-6 bg-slate-50/50">
                                        <h3 className="card-header__title">{t('file_repository')}</h3>
                                    </header>
                                    <div className="p-0">
                                        {files.filter(filterItem).length === 0 ? (
                                            <div className="p-12 text-center text-muted border-dashed">
                                                <span className="text-4xl block mb-2">📂</span>
                                                {t('no_files')}
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table-base w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="pl-6">{t('file')}</th>
                                                            <th>{t('patient')}</th>
                                                            <th className="pr-6 text-right">{t('actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {files.filter(filterItem).map(f => (
                                                            <tr key={f.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => window.open(f.file_url, '_blank')}>
                                                                <td className="pl-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xl">📄</span>
                                                                        <span className="font-bold text-main-800">{f.description || f.file_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="font-medium text-main-600">{f.patient_name}</span>
                                                                </td>
                                                                <td className="pr-6 text-right">
                                                                    {(user.role === 'admin' || user.role === 'secretary') && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm-compact"
                                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                            onClick={(e) => { e.stopPropagation(); setFileToDelete(f); }}
                                                                        >
                                                                            🗑️
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                        <div className="animate-fadeIn">
                            <MedicalHistoryTable
                                items={
                                    activeTab === 'prescriptions' ? combinedPrescriptions :
                                        activeTab === 'licenses' ? combinedLicenses :
                                            combinedCertificates
                                }
                                filterItem={filterItem}
                                onView={handleEditItem}
                                onDelete={
                                    activeTab === 'prescriptions' ? handleDeletePrescription :
                                        activeTab === 'licenses' ? handleDeleteLicense :
                                            (id, item) => handleDeleteRequest(id, item)
                                }
                                icon={activeTab === 'prescriptions' ? '💊' : activeTab === 'licenses' ? '📄' : '📜'}
                                title={
                                    activeTab === 'prescriptions' ? t('recent_prescriptions') :
                                        activeTab === 'licenses' ? t('recent_licenses') :
                                            t('recent_certificates')
                                }
                                originLabel={activeTab === 'certificates' ? t('certificate') : undefined}
                            />
                        </div>
                    )}
                </div>
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

            {/* --- Edit Modals --- */}
            {isEditing && selectedPrescription && (
                <Modal
                    isOpen={isEditing && !!selectedPrescription}
                    onClose={() => { setIsEditing(false); setSelectedPrescription(null); }}
                    title={`${t('prescription_for')} ${selectedPrescription.patient_name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => { setIsEditing(false); setSelectedPrescription(null); }}>{t('cancel')}</Button>
                            <Button onClick={handleUpdatePrescription}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('medications')}</label>
                            <MedicationAutocomplete
                                value=""
                                onChange={() => { }}
                                onSelectMedication={(med) => {
                                    const current = editData.medications.trim();
                                    const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                                    setEditData({ ...editData, medications: newValue });
                                }}
                            />
                            <textarea className="input-field mt-2" rows="4" value={editData.medications} onChange={e => setEditData({ ...editData, medications: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('instructions')}</label>
                            <textarea className="input-field" rows="3" value={editData.instructions} onChange={e => setEditData({ ...editData, instructions: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}

            {isEditing && selectedLicense && (
                <Modal
                    isOpen={isEditing && !!selectedLicense}
                    onClose={() => { setIsEditing(false); setSelectedLicense(null); }}
                    title={`${t('license_for')} ${selectedLicense.patient_name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => { setIsEditing(false); setSelectedLicense(null); }}>{t('cancel')}</Button>
                            <Button onClick={handleUpdateLicense}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('start_date')}</label>
                                <input type="date" className="input-field" value={licenseEditData.start_date} onChange={e => setLicenseEditData({ ...licenseEditData, start_date: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('days_duration')}</label>
                                <input type="number" className="input-field" value={licenseEditData.days_duration} onChange={e => setLicenseEditData({ ...licenseEditData, days_duration: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('diagnosis')}</label>
                            <textarea className="input-field" rows="3" value={licenseEditData.diagnosis} onChange={e => setLicenseEditData({ ...licenseEditData, diagnosis: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}

            {isEditing && selectedRequest && (
                <Modal
                    isOpen={isEditing && !!selectedRequest}
                    onClose={() => { setIsEditing(false); setSelectedRequest(null); }}
                    title={t('edit_request')}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => { setIsEditing(false); setSelectedRequest(null); }}>{t('cancel')}</Button>
                            <Button onClick={handleUpdateRequest}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('request_note')}</label>
                            <textarea className="input-field" rows="3" value={requestEditData.request_note} onChange={e => setRequestEditData({ ...requestEditData, request_note: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('doctor_reply')}</label>
                            <textarea className="input-field" rows="3" value={requestEditData.doctor_note} onChange={e => setRequestEditData({ ...requestEditData, doctor_note: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('debt_amount')} ($)</label>
                            <CurrencyInput className="input-field" value={requestEditData.debt_amount} onChange={e => setRequestEditData({ ...requestEditData, debt_amount: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MedicalDocuments;
