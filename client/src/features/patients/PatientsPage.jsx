
import React from 'react';
import { usePatientsPageController } from '@/features/patients/hooks/usePatientsPageController';
import { usePermissions } from '@/hooks/usePermissions';

// Atoms (Shared)
import MainLayout from '@/components/templates/MainLayout';
import { Button } from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';

// Molecules (Shared/Global)
import QRCodeModal from '@/features/patients/components/modals/QRCodeModal';
import Pagination from '@/components/atoms/Pagination';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

// Feature Components
import PatientList from './components/views/PatientList';
import PatientRecycleBin from './components/views/PatientRecycleBin';
import PatientDetailsView from './components/views/PatientDetailsView';
import PatientManagerModal from './components/modals/PatientManagerModal';
import DebtPaymentModal from './components/modals/DebtPaymentModal';

/**
 * PatientsPage (Orchestrator).
 * Coordinates patient listing, search, details, and recycle bin.
 */
const PatientsPage = () => {
    const { isStaff, user: authUser } = usePermissions();
    const controller = usePatientsPageController();
    const {
        user, t,
        patients, loading, detailsLoading,
        totalCount, currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        activeTab, setActiveTab,
        selectedPatientId, setSelectedPatientId, patientDetails,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,

        handlers,
    } = controller;

    const {
        fetchRecycleBin,
        handleNewClick,
        handleViewDetails,
        handleDeletePatient,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handleDebtAmountChange,
        handleDebtMethodChange,
        handlePayDebt,
        handleCycleRating,
        handleToggleNew,
        handleGenerateQR,
        handleGeneratePrescriptionLink,
        calculateFinancialRating,
        calculateAttendanceRating,
        handleRestorePatient,
    } = handlers;

    if (!authUser) return <Loading variant="full-page" />;

    // Only show global loading if we haven't fetched any patients yet (initial load)
    if (loading && !controller.fetched) return (
        <MainLayout wide flush>
            <Loading variant="centered" text={t('loading')} />
        </MainLayout>
    );

    if (detailsLoading) return (
        <MainLayout wide flush>
            <Loading variant="centered" />
        </MainLayout>
    );

    return (
        <MainLayout wide flush title={(!selectedPatientId || !patientDetails) ? t('patients') : null}>
            <div className="patients-page-orchestrator layout-content-area animate-fade-in">
                {(selectedPatientId && patientDetails) ? (
                    // --- DETAILS VIEW ---
                    <PatientDetailsView
                        details={patientDetails}
                        t={t}
                        user={user}
                        onBack={() => setSelectedPatientId(null)}
                        onEdit={() => handleEditClick(patientDetails)}
                        onDelete={handleDeletePatient}
                        onGenerateQR={handleGenerateQR}
                        onGeneratePrescriptionLink={handleGeneratePrescriptionLink}
                        onToggleNew={handleToggleNew}
                        onPayDebt={handleOpenDebtModal}
                    />

                ) : (
                    // --- LIST VIEW ---
                    <div className="patients-page__list-view">
                        <FeatureToolbar
                            className="patients-page-orchestrator__toolbar"
                            tabs={[
                                { id: 'list', label: t('active_list'), icon: 'groups' },
                                { 
                                    id: 'recycle', 
                                    label: t('recycle_bin'), 
                                    icon: 'delete',
                                    badge: recycleItems.length > 0 ? recycleItems.length : null,
                                    hidden: !isStaff
                                }
                            ]}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                if (tab === 'recycle') fetchRecycleBin();
                            }}
                            actions={
                                isStaff && activeTab === 'list' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleNewClick}
                                        icon={<Icon name="add" size="1.1rem" />}
                                    >
                                        {t('new_patient_btn')}
                                    </Button>
                                )
                            }
                        />

                        <main className="patients-page-orchestrator__main">
                            {activeTab === 'list' ? (
                                <div className="patients-page__table-wrapper">
                                    <section className="dashboard-card dashboard-card--no-padding dashboard-card--scroll-horizontal">
                                        <PatientList
                                            patients={patients}
                                            institutions={institutions}
                                            t={t}
                                            onViewDetails={handleViewDetails}
                                            onOpenDebt={handleOpenDebtModal}
                                            onToggleRating={handleCycleRating}
                                            calculateFinancialRating={calculateFinancialRating}
                                            calculateAttendanceRating={calculateAttendanceRating}
                                        />

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalCount={totalCount}
                                            itemsShowing={patients.length}
                                            onPageChange={handlePageChange}
                                            t={t}
                                        />
                                    </section>
                                </div>
                            ) : (
                                <PatientRecycleBin
                                    recycleItems={recycleItems}
                                    loading={loading}
                                    onRestore={handleRestorePatient}
                                />
                            )}
                        </main>
                    </div>
                )}
            </div>

            {/* --- GLOBALLY HOISTED MODALS --- */}
            <PatientManagerModal
                isOpen={editModal.open}
                onClose={() => setEditModal(prev => ({ ...prev, open: false }))}
                patient={editModal.data}
                onUpdate={handleUpdatePatient}
                insurances={insurances}
                doctors={doctors}
            />

            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal(prev => ({ ...prev, open: false }))}
                url={qrModal.url}
                expiresAt={qrModal.expiry}
                patientName={qrModal.patientName}
                patientPhone={qrModal.patientPhone}
            />

            <DebtPaymentModal
                isOpen={debtModal.open}
                onClose={() => setDebtModal(prev => ({ ...prev, open: false }))}
                onConfirm={() => handlePayDebt(debtModal.params)}
                amount={debtModal.params.amount}
                onAmountChange={handleDebtAmountChange}
                method={debtModal.params.method}
                onMethodChange={handleDebtMethodChange}
                t={t}
            />
        </MainLayout>
    );
};

export default PatientsPage;
