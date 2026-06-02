import React from 'react';
import { useMedicalDocumentsController } from './hooks/useMedicalDocumentsController';
import MedicalRequestForm from './components/forms/MedicalRequestForm';
import MedicalRequestList from './components/lists/MedicalRequestList';
import MedicalHistoryTable from './components/lists/MedicalHistoryTable';
import MedicalFileRepository from './components/lists/MedicalFileRepository';
import MedicalActionModals from './components/modals/MedicalActionModals';
import MedicalDocumentsPrintView from './components/ui/MedicalDocumentsPrintView';

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import Button from '@/components/atoms/Button';
import TabButton from '@/components/atoms/TabButton';
import TabNav from '@/components/molecules/TabNav';
import { formatDate, compareDates, getNow } from '@/utils/core/dateUtils';

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
        isEditing,
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
        handleTabChange, handleSubTabChange,
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
        ...requests.reduce((acc, r) => {
            if (r.type === 'prescription' && r.status === 'completed') {
                acc.push({
                    ...r,
                    _origin: 'request',
                    medications: r.request_note,
                    instructions: r.doctor_note
                });
            }
            return acc;
        }, [])
    ].toSorted((a, b) => compareDates(a.created_at, b.created_at, true));

    const combinedLicenses = [
        ...licenses.map(l => ({ ...l, _origin: 'license' })),
        ...requests.reduce((acc, r) => {
            if (r.type === 'license' && r.status === 'completed') {
                acc.push({
                    ...r,
                    _origin: 'request',
                    start_date: r.created_at,
                    days_duration: '-',
                    diagnosis: r.request_note
                });
            }
            return acc;
        }, [])
    ].toSorted((a, b) => compareDates(a.created_at, b.created_at, true));

    const combinedCertificates = requests.reduce((acc, r) => {
        if (r.type === 'certificate' && r.status === 'completed') {
            acc.push({
                ...r,
                _origin: 'request',
                description: r.request_note
            });
        }
        return acc;
    }, []).toSorted((a, b) => compareDates(a.created_at, b.created_at, true));

    const printDate = React.useMemo(() => {
        if (t) { /* force reactivity on translation change */ }
        return formatDate(getNow(), { time: true });
    }, [t]);

    return (
        <MainLayout wide flush title={t('medical_documents')}>
            <div className="medical-documents-page-orchestrator layout-content-area">
                <FeatureToolbar
                    className="medical-documents-page-orchestrator__top-actions"
                    tabs={[
                        { id: 'requests', label: t('requests_workflow'), icon: 'description' },
                        { id: 'files', label: t('file_repository'), icon: 'folder_open' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: 'medication' },
                        { id: 'licenses', label: t('medical_licenses'), icon: 'description' },
                        { id: 'certificates', label: t('certificates'), icon: 'verified' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    actions={
                        ['requests', 'prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                            <>
                                {(activeTab === 'requests' && requestsSubTab === 'list' || activeTab === 'prescriptions') && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleExportJSON}
                                        icon={<Icon name="save" size="1rem" />}
                                    >
                                        {t('export_json')}
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handlePrintPrescriptions}
                                    icon={<Icon name="print" size="1rem" />}
                                >
                                    {t('print_backup')}
                                </Button>
                            </>
                        )
                    }
                />

                <main className="medical-documents-page-orchestrator__main animate-fade-in no-print">
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

                <MedicalDocumentsPrintView 
                    printData={printData} 
                    printDate={printDate} 
                    t={t} 
                />
            </div>
        </MainLayout>
    );
};

export default MedicalDocumentsPage;
