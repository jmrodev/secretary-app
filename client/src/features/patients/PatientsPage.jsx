
import React from 'react';
import { usePatientsPageController } from '@/features/patients/hooks/usePatientsPageController';
import { usePermissions } from '@/hooks/usePermissions';

// Atoms (Shared)
import { MainLayout } from '@/components/templates/MainLayout';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import { Icon } from '@/components/atoms/Icon';

// Molecules (Shared/Global)
import { QRCodeModal } from '@/features/patients/components/modals/QRCodeModal';
import { Pagination } from '@/components/atoms/Pagination';

import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';
import { SearchBar } from '@/components/molecules/SearchBar';

// Feature Components
import { PatientList } from './components/views/PatientList';
import { PatientRecycleBin } from './components/views/PatientRecycleBin';
import { PatientDetailsView } from './components/views/PatientDetailsView';
import { PatientManagerModal } from './components/modals/PatientManagerModal';
import { DebtPaymentModal } from './components/modals/DebtPaymentModal';
import { BehaviorRatingModal } from './components/modals/BehaviorRatingModal';
import styles from './PatientsPage.module.css';

/**
 * PatientsPage (Orchestrator).
 * Coordinates patient listing, search, details, and recycle bin.
 */
export const PatientsPage = () => {
    const { isStaff, user: authUser } = usePermissions();
    const controller = usePatientsPageController();
    const {
        user, t,
        patients, loading, detailsLoading,
        totalCount, currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        activeTab, setActiveTab,
        selectedPatientId, setSelectedPatientId, patientDetails,
        searchTerm, setSearchTerm, executeSearch,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,
        behaviorRatingModal,

        handlers,
    } = controller;

    const {
        fetchRecycleBin,
        handleNewClick,
        handleViewDetails,
        handleDeletePatient,
        handleBackToList,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handleDebtAmountChange,
        handleDebtMethodChange,
        handlePayDebt,
        handleCycleRating,
        handleOpenBehaviorRatingModal,
        handleCloseBehaviorRatingModal,
        handleSaveBehaviorRating,
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
        <MainLayout hideSearch>
            <Loading variant="centered" text={t('loading')} />
        </MainLayout>
    );

    if (detailsLoading) return (
        <MainLayout hideSearch>
            <Loading variant="centered" />
        </MainLayout>
    );

    return (
        <MainLayout hideSearch title={(!selectedPatientId || !patientDetails) ? t('patients') : null}>
            <div className={styles.PatientsPage__root}>
                {(selectedPatientId && patientDetails) ? (
                    // --- DETAILS VIEW ---
                    <PatientDetailsView
                        details={patientDetails}
                        t={t}
                        user={user}
                        onBack={handleBackToList}
                        onEdit={() => handleEditClick(patientDetails)}
                        onDelete={handleDeletePatient}
                        onGenerateQR={handleGenerateQR}
                        onGeneratePrescriptionLink={handleGeneratePrescriptionLink}
                        onToggleNew={handleToggleNew}
                        onPayDebt={handleOpenDebtModal}
                        onEditRating={handleOpenBehaviorRatingModal}
                        canEditRating={isStaff}
                    />

                ) : (
                    // --- LIST VIEW ---
                    <div className={styles.PatientsPage__listView}>
                        <FeatureToolbar
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
                            search={
                                activeTab === 'list' && (
                                    <SearchBar
                                        value={searchTerm}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchTerm(val);
                                            if (val === '') {
                                                executeSearch('');
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                executeSearch();
                                            }
                                        }}
                                        onClear={() => {
                                            setSearchTerm('');
                                            executeSearch('');
                                        }}
                                        placeholder={t('search_patients_placeholder')}
                                    />
                                )
                            }
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

                        <section className={styles.PatientsPage__content}>
                            {activeTab === 'list' ? (
                                <div className={styles.PatientsPage__tableWrapper}>
                                    <PatientList
                                        patients={patients}
                                        institutions={institutions}
                                        t={t}
                                        onViewDetails={handleViewDetails}
                                        onOpenDebt={handleOpenDebtModal}
                                        onToggleRating={handleCycleRating}
                                        onEditRating={handleOpenBehaviorRatingModal}
                                        canEditRating={isStaff}
                                        calculateFinancialRating={calculateFinancialRating}
                                        calculateAttendanceRating={calculateAttendanceRating}
                                    />

                                    {totalPages > 1 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalCount={totalCount}
                                            itemsShowing={patients.length}
                                            onPageChange={handlePageChange}
                                            t={t}
                                        />
                                    )}
                                </div>
                            ) : (
                                <PatientRecycleBin
                                    recycleItems={recycleItems}
                                    loading={loading}
                                    onRestore={handleRestorePatient}
                                />
                            )}
                        </section>
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

            <BehaviorRatingModal
                isOpen={behaviorRatingModal.open}
                patient={behaviorRatingModal.patient}
                onClose={handleCloseBehaviorRatingModal}
                onSave={handleSaveBehaviorRating}
                t={t}
            />
        </MainLayout>
    );
};

