import React from 'react';
import { useMedicalDocumentsController } from '../controllers/useMedicalDocumentsController';

// Components
import MainLayout from '../components/templates/MainLayout';
import Modal from '../components/molecules/Modal';
import TransactionModal from '../components/molecules/TransactionModal';
import PatientSearchSelect from '../components/molecules/PatientSearchSelect';
import MedicalRequestForm from '../components/organisms/MedicalRequestForm';
import MedicalRequestList from '../components/organisms/MedicalRequestList';
import MedicalHistoryTable from '../components/organisms/MedicalHistoryTable';
import MedicationAutocomplete from '../components/molecules/MedicationAutocomplete';
import CurrencyInput from '../components/atoms/CurrencyInput';
import Button from '../components/atoms/Button';
import SearchBar from '../components/molecules/SearchBar';
import TabNav from '../components/molecules/TabNav';
import TabButton from '../components/atoms/TabButton';
import Icon from '../components/atoms/Icon';
import { formatDate } from '../utils/dateUtils';

// Styles
import './MedicalDocuments.css';

const MedicalDocuments = () => {
    const controller = useMedicalDocumentsController();
    const {
        user, t, activeTab, requestsSubTab,
        searchTerm, isEditing,
        requests, files, prescriptions, licenses, doctors,
        selectedFile, selectedPrescription,
        selectedLicense, selectedRequest,
        filePatient, fileDesc,
        fileToDelete, actionModal, actionNote,
        paymentModal, editData, licenseEditData,
        requestEditData,
        reqType, reqNote, bonified,
        sendToDoctor,

        // Permissions
        canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest,
        printData,
        handlers
    } = controller;

    const {
        handleSearchChange, handleTabChange, handleSubTabChange,
        handleFileDescChange, handleFilePatientChange, handleFileUploadChange,
        handleActionNoteChange, handleEditDataChange, handleLicenseEditDataChange,
        handleRequestEditDataChange, handleSelectMedication, toggleEditing,
        closeActionModal, openActionModal, closePaymentModal, openPaymentModal,
        closeDeleteFileModal, openDeleteFileModal,
        handleCreateRequest, handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleEditItem, handleDeleteLicense, fetchRequests,
        filterItem
    } = handlers;

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

    return (
        <MainLayout wide>
            <div className="medical-documents no-print">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('medical_documents')}</h1>
                        <p className="page-header__subtitle">{t('medical_docs_subtitle') || 'Gestione requerimientos, archivos e historial de pacientes.'}</p>
                    </div>
                </header>

                <TabNav className="medical-documents__tabs">
                    {[
                        { id: 'requests', label: t('requests_workflow'), icon: 'REQUESTS' },
                        { id: 'files', label: t('file_repository'), icon: 'DOCUMENTS' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: 'PRESCRIPTION' },
                        { id: 'licenses', label: t('medical_licenses'), icon: 'LICENSE' },
                        { id: 'certificates', label: t('certificates') || 'Certificados', icon: 'CERTIFICATE' }
                    ].map(tab => (
                        <TabButton
                            key={tab.id}
                            isActive={activeTab === tab.id}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <span className="medical-documents__tab-icon">
                                <Icon name={tab.icon} size="1.2rem" />
                            </span>
                            {tab.label}
                        </TabButton>
                    ))}
                </TabNav>

                <section className="action-bar">
                    <div className="action-bar__search">
                        <SearchBar
                            value={searchTerm}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder={t('search_docs_placeholder')}
                        />
                    </div>
                </section>

                <div className="medical-documents__tabs-content animate-fadeIn">
                    {activeTab === 'requests' && (
                        <div className="medical-documents__requests-layout">
                            <TabNav className="tab-nav--sub">
                                <TabButton
                                    isActive={requestsSubTab === 'list'}
                                    onClick={() => handleSubTabChange('list')}
                                >
                                    {t('request_status')}
                                </TabButton>
                                <TabButton
                                    isActive={requestsSubTab === 'new'}
                                    onClick={() => handleSubTabChange('new')}
                                    icon={<Icon name="ADD" size="1rem" />}
                                >
                                    {t('new_request')}
                                </TabButton>
                            </TabNav>

                            {requestsSubTab === 'new' ? (
                                <MedicalRequestForm
                                    doctors={doctors}
                                    initialType={reqType}
                                    initialSendToDoctor={sendToDoctor}
                                    onRequestCreated={() => {
                                        handlers.fetchRequests();
                                        handleSubTabChange('list');
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="medical-documents__section-header">
                                        <h3 className="section-title mb-0">{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
                                        <div className="medical-documents__section-actions">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={controller.handleExportJSON}
                                                icon={<Icon name="SAVE" size="1rem" />}
                                            >
                                                {t('export_json')}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={controller.handlePrintPrescriptions}
                                                icon={<Icon name="PRINT" size="1rem" />}
                                            >
                                                {t('print_backup')}
                                            </Button>
                                        </div>
                                    </div>
                                    <MedicalRequestList
                                        requests={requests}
                                        filterItem={filterItem}
                                        handleDeleteRequest={handleDeleteRequest}
                                        openActionModal={openActionModal}
                                        setPaymentModal={openPaymentModal}
                                        canDelete={user.role === 'admin' || canDeleteRequest}
                                        handleEditRequest={handleEditItem}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="medical-documents__repository">
                            <section className="medical-documents__upload-section">
                                <div className="card medical-documents__upload-card">
                                    <header className="card-header border-b-0 mb-4">
                                        <h3 className="card-header__title">{t('upload_document')}</h3>
                                    </header>
                                    <form className="config-flex--column config-flex--gap-4" onSubmit={handleFileUpload}>
                                        <div className="input-group">
                                            <label className="input-label">{t('patient_label')}</label>
                                            <PatientSearchSelect value={filePatient} onChange={handleFilePatientChange} placeholder={t('select_patient')} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('description')}</label>
                                            <input className="input-field" value={fileDesc} onChange={e => handleFileDescChange(e.target.value)} placeholder="e.g. Lab Results PDF" required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('file')}</label>
                                            <input type="file" className="input-field" onChange={e => handleFileUploadChange(e.target.files[0])} required />
                                        </div>
                                        <Button type="submit" className="w-full">{t('upload_file')}</Button>
                                    </form>
                                </div>
                            </section>

                            <section className="medical-documents__list-section">
                                <div className="medical-documents__file-list">
                                    <header className="card-header border-b mb-0 p-6 bg-slate-50/50">
                                        <h3 className="card-header__title">{t('file_repository')}</h3>
                                    </header>
                                    <div className="medical-documents__table-container">
                                        {files.filter(filterItem).length === 0 ? (
                                            <div className="medical-documents__empty-repository">
                                                <Icon name="DOCUMENTS" size="3rem" className="medical-documents__empty-icon" />
                                                {t('no_files')}
                                            </div>
                                        ) : (
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
                                                        <tr key={f.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.open(f.file_url, '_blank')}>
                                                            <td className="pl-6 py-4">
                                                                <div className="config-flex">
                                                                    <Icon name="DOCUMENTS" size="1.2rem" className="medical-documents__file-icon" />
                                                                    <span className="medical-documents__file-name">{f.description || f.file_name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="medical-documents__patient-name">{f.patient_name}</span>
                                                            </td>
                                                            <td className="pr-6 text-right">
                                                                {(user.role === 'admin' || canDeleteFile) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm-compact"
                                                                        className="text-danger"
                                                                        onClick={(e) => { e.stopPropagation(); openDeleteFileModal(f); }}
                                                                        icon={<Icon name="DELETE" size="1rem" />}
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                        <div className="config-flex--column config-flex--gap-4">
                            <div className="medical-documents__section-header">
                                <h2 className="section-title mb-0">
                                    <Icon
                                        name={activeTab === 'prescriptions' ? 'PRESCRIPTION' : activeTab === 'licenses' ? 'LICENSE' : 'CERTIFICATE'}
                                        size="1.5rem"
                                        className="mr-2"
                                    />
                                    {activeTab === 'prescriptions' ? t('prescriptions') :
                                        activeTab === 'licenses' ? t('medical_licenses') :
                                            (t('certificates') || 'Certificados')}
                                </h2>
                                <div className="medical-documents__section-actions">
                                    {activeTab === 'prescriptions' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={controller.handleExportJSON}
                                        >
                                            💾 {t('export_json')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={controller.handlePrintPrescriptions}
                                    >
                                        🖨️ {t('print_backup')}
                                    </Button>
                                </div>
                            </div>
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
                                canDelete={
                                    user.role === 'admin' ||
                                    (activeTab === 'prescriptions' && canDeletePrescription) ||
                                    (['licenses', 'certificates'].includes(activeTab) && canDeleteLicense)
                                }
                                icon={activeTab === 'prescriptions' ? 'PRESCRIPTION' : activeTab === 'licenses' ? 'LICENSE' : 'CERTIFICATE'}
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

                {/* --- Modals --- */}
                <Modal
                    isOpen={actionModal.open}
                    onClose={closeActionModal}
                    title={actionModal.type === 'completed' ? t('approve_request') : t('reject_request')}
                    footer={
                        <>
                            <Button variant="secondary" onClick={closeActionModal}>{t('cancel')}</Button>
                            <Button onClick={() => handleUpdateStatus(actionModal.id, actionModal.type, actionNote)}>{actionModal.type === 'completed' ? t('approve') : t('reject')}</Button>
                        </>
                    }
                >
                    <div className="input-group">
                        <label className="input-label">{actionModal.type === 'completed' ? t('message_optional') : t('reason_rejection')}</label>
                        <textarea className="input-field" rows="3" value={actionNote} onChange={e => handleActionNoteChange(e.target.value)} autoFocus />
                    </div>
                </Modal>

                <TransactionModal
                    isOpen={paymentModal.open}
                    onClose={closePaymentModal}
                    initialData={paymentModal.initialData}
                    requestId={paymentModal.reqId}
                    onSuccess={fetchRequests}
                />

                <Modal
                    isOpen={!!fileToDelete}
                    onClose={closeDeleteFileModal}
                    title={t('confirm_delete')}
                    footer={
                        <>
                            <Button variant="secondary" onClick={closeDeleteFileModal}>{t('cancel')}</Button>
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
                        onClose={() => toggleEditing(false)}
                        title={`${t('prescription_for')} ${selectedPrescription.patient_name}`}
                        footer={
                            <>
                                <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                                <Button onClick={handleUpdatePrescription}>{t('save')}</Button>
                            </>
                        }
                    >
                        <div className="config-flex--column config-flex--gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('medications')}</label>
                                <MedicationAutocomplete
                                    value=""
                                    onChange={() => { }}
                                    onSelectMedication={handleSelectMedication}
                                />
                                <textarea className="input-field mt-4" rows="4" value={editData.medications} onChange={e => handleEditDataChange('medications', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('instructions')}</label>
                                <textarea className="input-field" rows="3" value={editData.instructions} onChange={e => handleEditDataChange('instructions', e.target.value)} />
                            </div>
                        </div>
                    </Modal>
                )}

                {isEditing && selectedLicense && (
                    <Modal
                        isOpen={isEditing && !!selectedLicense}
                        onClose={() => toggleEditing(false)}
                        title={`${t('license_for')} ${selectedLicense.patient_name}`}
                        footer={
                            <>
                                <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                                <Button onClick={handleUpdateLicense}>{t('save')}</Button>
                            </>
                        }
                    >
                        <div className="config-flex--column config-flex--gap-4">
                            <div className="config-grid config-grid--2col">
                                <div className="input-group">
                                    <label className="input-label">{t('start_date')}</label>
                                    <input type="date" className="input-field" value={licenseEditData.start_date} onChange={e => handleLicenseEditDataChange('start_date', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('days_duration')}</label>
                                    <input type="number" className="input-field" value={licenseEditData.days_duration} onChange={e => handleLicenseEditDataChange('days_duration', e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('diagnosis')}</label>
                                <textarea className="input-field" rows="3" value={licenseEditData.diagnosis} onChange={e => handleLicenseEditDataChange('diagnosis', e.target.value)} />
                            </div>
                        </div>
                    </Modal>
                )}

                {isEditing && selectedRequest && (
                    <Modal
                        isOpen={isEditing && !!selectedRequest}
                        onClose={() => toggleEditing(false)}
                        title={t('edit_request')}
                        footer={
                            <>
                                <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                                <Button onClick={handleUpdateRequest}>{t('save')}</Button>
                            </>
                        }
                    >
                        <div className="config-flex--column config-flex--gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('request_note')}</label>
                                <textarea className="input-field" rows="3" value={requestEditData.request_note} onChange={e => handleRequestEditDataChange('request_note', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('doctor_reply')}</label>
                                <textarea className="input-field" rows="3" value={requestEditData.doctor_note} onChange={e => handleRequestEditDataChange('doctor_note', e.target.value)} />
                            </div>

                            <div className="medical-documents__toggle-wrapper">
                                <input
                                    type="checkbox"
                                    id="edit-req-bonified"
                                    checked={requestEditData.bonified}
                                    onChange={e => handleRequestEditDataChange('bonified', e.target.checked)}
                                    className="switch-input"
                                />
                                <label htmlFor="edit-req-bonified" className="medical-documents__toggle-label">
                                    {t('bonificado') || 'Bonificado (Costo $0)'}
                                </label>
                            </div>

                            {!requestEditData.bonified && (
                                <div className="config-flex--column config-flex--gap-4">
                                    <div className="input-group">
                                        <label className="input-label">{t('debt_amount')} ($)</label>
                                        <CurrencyInput
                                            className="input-field"
                                            value={requestEditData.debt_amount}
                                            onChange={e => handleRequestEditDataChange('debt_amount', e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">{t('payment_method') || 'Método de Pago'}</label>
                                        <div className="medical-documents__payment-selector">
                                            {['cash', 'transfer', 'debit', 'credit', 'mercadopago'].map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => handleRequestEditDataChange('payment_method', m)}
                                                    className={`medical-documents__payment-btn ${requestEditData.payment_method === m ? 'medical-documents__payment-btn--active' : ''}`}
                                                >
                                                    {t(m) || m.charAt(0).toUpperCase() + m.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
            </div>

            {/* Print Section - BEM compliant */}
            <div className="medical-documents__print-container">
                <header className="medical-documents__print-header">
                    <h1 className="medical-documents__print-title">Reporte de Recetas y Solicitudes</h1>
                    <p className="medical-documents__print-date">Generado el {formatDate(new Date(), { time: true })}</p>
                </header>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Paciente</th>
                            <th>Médico</th>
                            <th>Origen</th>
                            <th>Pago</th>
                            <th>Detalle / Medicamentos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printData && printData.map((item, idx) => (
                            <tr key={idx}>
                                <td>{formatDate(item.date)}</td>
                                <td className="font-bold">{item.patient_name}</td>
                                <td>{item.doctor_name}</td>
                                <td>
                                    {item.source_type === 'direct' ? 'Consulta' : 'Solicitud'}
                                </td>
                                <td>
                                    {item.source_type === 'request' ? (
                                        <span className={`status-chip status-${item.payment_status}`}>
                                            {item.payment_status === 'paid' ? 'PAGADO' :
                                                item.payment_status === 'debt' ? 'DEUDA' :
                                                    item.payment_status === 'bonified' ? 'BONIF.' : item.payment_status}
                                            {item.amount > 0 && ` $${item.amount}`}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td>
                                    <div className="config-flex--column">
                                        <span className="font-mono">{item.medications}</span>
                                        {item.instructions && <span className="text-muted italic">{item.instructions}</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </MainLayout>
    );
};

export default MedicalDocuments;
