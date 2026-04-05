import React from 'react';
import { 
    useMedicalDocumentsController,
    MedicalRequestForm,
    MedicalRequestList,
    MedicalHistoryTable,
    MedicalFileRepository,
    MedicalActionModals,
    DocumentsHeader,
    DocumentsSidebar
} from './index'; // Using local index for feature components

// Global Atomic Components
import MainLayout from '../../components/templates/MainLayout';
import Loading from '../../components/atoms/Loading';
import Icon from '../../components/atoms/Icon';
import TabButton from '../../components/atoms/TabButton';
import TabNav from '../../components/molecules/TabNav';
import { formatDate } from '../../utils/dateUtils';

// Styles
import './MedicalDocumentsPage.css';

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
        selectedFile, selectedPrescription,
        selectedLicense, selectedRequest,
        filePatient, fileDesc,
        fileToDelete, actionModal, actionNote,
        paymentModal, editData, licenseEditData,
        requestEditData,
        reqType, reqNote,
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
        handleCreateRequest, handleUpdateStatus, handleFileUpload, confirmFileDelete,
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

    if (loading) return (
        <MainLayout wide>
            <Loading variant="centered" />
        </MainLayout>
    );

    return (
        <MainLayout wide>
            <div className="medical-documents-page">
                <div className="medical-documents no-print">
                <DocumentsHeader t={t} />

                <div className="dashboard-grid animate-fadeIn">
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

                    <main className="dashboard-main">
                        <div className="medical-documents__tabs-content">
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
                                </div>
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
                </div>

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
        </div>
        </MainLayout>
    );
};

export default MedicalDocumentsPage;
