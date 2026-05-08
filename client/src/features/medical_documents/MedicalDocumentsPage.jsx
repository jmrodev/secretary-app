import React from 'react';
import { 
    useMedicalDocumentsController,
    MedicalRequestForm,
    MedicalRequestList,
    MedicalHistoryTable,
    MedicalFileRepository,
    MedicalActionModals,
    DocumentsSidebar
} from '@/features/medical_documents/index'; // Using local index for feature components

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import TabButton from '@/components/atoms/TabButton';
import TabNav from '@/components/molecules/TabNav';
import { formatDate } from '@/utils/dateUtils';

// Styles
import './MedicalDocumentsPage.css';
import '@/features/dashboard/components/DashboardLayout.css'; // Reuse dashboard grid styles

/**
 * MedicalDocumentsPage (Orchestrator).
 * Coordinates medical requests, history, and file repository.
 */
const MedicalDocumentsPage = () => {
    const controller = useMedicalDocumentsController();
    const {
        user, t, activeTab, requestsSubTab,
        searchTerm, isEditing,
        requests, files, prescriptions, licenses, doctors,
        requestsPage, requestsTotalPages,
        prescriptionsPage, prescriptionsTotalPages,
        licensesPage, licensesTotalPages,
        selectedPrescription,
        selectedLicense, selectedRequest,
        filePatient, fileDesc,
        fileToDelete, actionModal, actionNote,
        paymentModal, editData, licenseEditData,
        requestEditData,
        reqType,
        sendToDoctor,
        canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest,
        printData,
        handlers,
        loading
    } = controller;

    const {
        handleSearchChange, handleTabChange, handleSubTabChange,
        handleFileDescChange, handleFilePatientChange, handleFileUploadChange,
        handleActionNoteChange, handleEditDataChange, handleLicenseEditDataChange,
        handleRequestEditDataChange, handleSelectMedication, toggleEditing,
        closeActionModal, openActionModal, closePaymentModal, openPaymentModal,
        closeDeleteFileModal, openDeleteFileModal,
        handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleEditItem, handleDeleteLicense, fetchRequests,
        filterItem, handleExportJSON, handlePrintPrescriptions
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

    // No more global loading returns to avoid jarring layout shifts.
    // Instead, we pass the loading state to sub-components for localized feedback.

    return (
        <MainLayout wide flush title={t('medical_documents')}>
            <div className="medical-documents-page layout-content-area">
                <section className="dashboard-layout__grid animate-fade-in no-print">
                    <aside className="dashboard-layout__sidebar">
                        <DocumentsSidebar
                            t={t}
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            searchTerm={searchTerm}
                            handleSearchChange={handleSearchChange}
                            requestsSubTab={requestsSubTab}
                            handleExportJSON={handleExportJSON}
                            handlePrintPrescriptions={handlePrintPrescriptions}
                        />
                    </aside>

                    <main className="dashboard-layout__main">
                        <div className="medical-documents__tabs-content">
                            {activeTab === 'requests' && (
                                <article className="medical-documents__requests-layout">
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
                                            icon={<Icon name="add" size="1rem" />}
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
                                        <MedicalRequestList
                                            requests={requests}
                                            loading={loading}
                                            handleDeleteRequest={handleDeleteRequest}
                                            openActionModal={openActionModal}
                                            setPaymentModal={openPaymentModal}
                                            onBonify={handlers.handleBonifyRequest}
                                            canDelete={user?.role === 'admin' || canDeleteRequest}
                                            handleEditRequest={handleEditItem}
                                            currentPage={requestsPage}
                                            totalPages={requestsTotalPages}
                                            onPageChange={handlers.handlePageChange}
                                        />
                                    )}
                                </article>
                            )}

                            {activeTab === 'files' && (
                                <MedicalFileRepository
                                    t={t}
                                    user={user}
                                    files={files}
                                    filterItem={filterItem}
                                    filePatient={filePatient}
                                    fileDesc={fileDesc}
                                    handleFilePatientChange={handleFilePatientChange}
                                    handleFileDescChange={handleFileDescChange}
                                    handleFileUploadChange={handleFileUploadChange}
                                    handleFileUpload={handleFileUpload}
                                    openDeleteFileModal={openDeleteFileModal}
                                    canDeleteFile={canDeleteFile}
                                />
                            )}

                            {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                                <MedicalHistoryTable
                                    items={
                                        activeTab === 'prescriptions' ? combinedPrescriptions :
                                            activeTab === 'licenses' ? combinedLicenses :
                                                combinedCertificates
                                    }
                                    loading={loading}
                                    onView={handleEditItem}
                                    onDelete={
                                        activeTab === 'prescriptions' ? handleDeletePrescription :
                                            activeTab === 'licenses' ? handleDeleteLicense :
                                                (id, item) => handleDeleteRequest(id, item)
                                    }
                                    canDelete={
                                        user?.role === 'admin' ||
                                        (activeTab === 'prescriptions' && canDeletePrescription) ||
                                        (['licenses', 'certificates'].includes(activeTab) && canDeleteLicense)
                                    }
                                    icon={activeTab === 'prescriptions' ? 'medication' : activeTab === 'licenses' ? 'description' : 'verified'}
                                    title={
                                        activeTab === 'prescriptions' ? t('recent_prescriptions') :
                                            activeTab === 'licenses' ? t('recent_licenses') :
                                                t('recent_certificates')
                                    }
                                    originLabel={activeTab === 'certificates' ? t('certificate') : undefined}
                                    // Pagination Props
                                    currentPage={
                                        activeTab === 'prescriptions' ? prescriptionsPage :
                                            activeTab === 'licenses' ? licensesPage :
                                                requestsPage
                                    }
                                    totalPages={
                                        activeTab === 'prescriptions' ? prescriptionsTotalPages :
                                            activeTab === 'licenses' ? licensesTotalPages :
                                                requestsTotalPages
                                    }
                                    onPageChange={
                                        activeTab === 'prescriptions' ? handlers.handlePrescriptionPageChange :
                                            activeTab === 'licenses' ? handlers.handleLicensePageChange :
                                                handlers.handlePageChange
                                    }
                                />
                            )}
                        </div>
                    </main>
                </section>

                <MedicalActionModals
                    t={t}
                    isEditing={isEditing}
                    toggleEditing={toggleEditing}
                    actionModal={actionModal}
                    closeActionModal={closeActionModal}
                    actionNote={actionNote}
                    handleActionNoteChange={handleActionNoteChange}
                    handleUpdateStatus={handleUpdateStatus}
                    paymentModal={paymentModal}
                    closePaymentModal={closePaymentModal}
                    fetchRequests={fetchRequests}
                    fileToDelete={fileToDelete}
                    closeDeleteFileModal={closeDeleteFileModal}
                    confirmFileDelete={confirmFileDelete}
                    selectedPrescription={selectedPrescription}
                    selectedLicense={selectedLicense}
                    selectedRequest={selectedRequest}
                    editData={editData}
                    handleEditDataChange={handleEditDataChange}
                    handleSelectMedication={handleSelectMedication}
                    handleUpdatePrescription={handleUpdatePrescription}
                    licenseEditData={licenseEditData}
                    handleLicenseEditDataChange={handleLicenseEditDataChange}
                    handleUpdateLicense={handleUpdateLicense}
                    requestEditData={requestEditData}
                    handleRequestEditDataChange={handleRequestEditDataChange}
                    handleUpdateRequest={handleUpdateRequest}
                />

                {/* Print Section - BEM compliant */}
                <div className="medical-documents__print-container">
                    <header className="medical-documents__print-header">
                        <h1 className="medical-documents__print-title">{t('prescription_requests_report') || 'Reporte de Recetas y Solicitudes'}</h1>
                        <p className="medical-documents__print-date">{t('generated_at', { date: formatDate(new Date(), { time: true }) }) || `Generado el ${formatDate(new Date(), { time: true })}`}</p>
                    </header>

                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>{t('date_label')}</th>
                                <th>{t('patient')}</th>
                                <th>{t('doctor')}</th>
                                <th>{t('origin')}</th>
                                <th>{t('payment')}</th>
                                <th>{t('detail_meds') || 'Detalle / Medicamentos'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printData && printData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{formatDate(item.date)}</td>
                                    <td className="print-table__cell--bold">{item.patient_name}</td>
                                    <td>{item.doctor_name}</td>
                                    <td>
                                        {item.source_type === 'direct' ? t('consult') : t('request')}
                                    </td>
                                    <td>
                                        {item.source_type === 'request' ? (
                                            <span className={`status-chip status-${item.payment_status}`}>
                                                {item.payment_status === 'paid' ? t('paid').toUpperCase() :
                                                    item.payment_status === 'debt' ? t('debt').toUpperCase() :
                                                        item.payment_status === 'bonified' ? (t('bonified') || 'BONIF.').toUpperCase() : item.payment_status}
                                                {item.amount > 0 && ` $${item.amount}`}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div className="config-flex--column">
                                            <span className="print-table__cell--mono">{item.medications}</span>
                                            {item.instructions && <span className="print-table__cell--muted">{item.instructions}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
};

export default MedicalDocumentsPage;
