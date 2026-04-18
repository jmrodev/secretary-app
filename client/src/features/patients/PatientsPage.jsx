
import React from 'react';
import { usePatientsPageController } from '@/features/patients/hooks/usePatientsPageController';
import { usePermissions } from '@/hooks/usePermissions';

// Atoms (Shared)
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';

// Molecules (Shared/Global)
import QRCodeModal from '@/features/patients/components/QRCodeModal';
import SearchBar from '@/components/molecules/SearchBar';
import Pagination from '@/components/molecules/Pagination';
import TabNav from '@/components/molecules/TabNav';

// Feature components (Internal - Local to this folder)
import PatientList from '@/features/patients/components/PatientList';
import PatientDetailsView from '@/features/patients/components/PatientDetailsView';
import PatientRecycleBin from '@/features/patients/components/PatientRecycleBin';
import PatientMedications from '@/features/patients/components/PatientMedications';
import DebtPaymentModal from '@/features/patients/components/DebtPaymentModal';
import PatientManagerModal from '@/features/patients/components/PatientManagerModal';

import './PatientsPage.css';

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
        searchTerm, setSearchTerm,
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

    if (loading || !authUser) return (
        <MainLayout wide>
            <Loading variant="centered" text={t('loading')} />
        </MainLayout>
    );

    if (detailsLoading) return (
        <MainLayout wide>
            <Loading variant="centered" />
        </MainLayout>
    );

    return (
        <MainLayout wide>
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
                >
                    <PatientMedications patientId={patientDetails.id} patientName={patientDetails.full_name} />
                </PatientDetailsView>
            ) : (
                // --- LIST VIEW ---
                <>
                    <header className="dashboard-header">
                        <h1 className="dashboard-header__title">{t('patients')}</h1>
                        <p className="dashboard-header__subtitle">{t('patients_subtitle')}</p>
                    </header>

                    <div className="dashboard-grid animate-fadeIn">
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-nav-bar">
                                <TabNav className="patients__nav">
                                    <TabButton
                                        isActive={activeTab === 'list'}
                                        onClick={() => setActiveTab('list')}
                                        icon={<Icon name="groups" size="1.1rem" />}
                                    >
                                        {t('active_list')}
                                    </TabButton>
                                    {isStaff && (
                                        <TabButton
                                            isActive={activeTab === 'recycle'}
                                            onClick={() => { setActiveTab('recycle'); fetchRecycleBin(); }}
                                            icon={<Icon name="delete" size="1.1rem" />}
                                        >
                                            {t('recycle_bin')}
                                            {recycleItems.length > 0 && <span className="patients__dot-badge">{recycleItems.length}</span>}
                                        </TabButton>
                                    )}
                                </TabNav>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="search" size="1.2rem" />
                                    {t('search')}
                                </h3>
                                <div className="patients-sidebar__search">
                                    {activeTab === 'list' && (
                                        <SearchBar
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder={t('search_placeholder')}
                                            className="action-bar__search"
                                        />
                                    )}
                                </div>
                            </div>

                            {isStaff && activeTab === 'list' && (
                                <div className="dashboard-card">
                                    <h3 className="dashboard-card__title">
                                        <Icon name="build" size="1.2rem" />
                                        {t('actions')}
                                    </h3>
                                    <div className="patients-sidebar__tools">
                                        <Button
                                            variant="primary"
                                            className="w-full justify-start"
                                            onClick={handleNewClick}
                                            icon={<Icon name="add" size="1.1rem" />}
                                        >
                                            {t('new_patient_btn')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </aside>

                        <main className="dashboard-main">
                            {activeTab === 'list' ? (
                                <div className="patients-list-view">
                                    <div className="dashboard-card no-padding">
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
                                    </div>
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
                </>
            )}

            {/* --- GLOBALLY HOISTED MODALS --- */}
            <PatientManagerModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ ...editModal, open: false })}
                patient={editModal.data}
                onUpdate={handleUpdatePatient}
                insurances={insurances}
                doctors={doctors}
            />

            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false })}
                url={qrModal.url}
                expiresAt={qrModal.expiry}
                patientName={qrModal.patientName}
                patientPhone={qrModal.patientPhone}
            />

            <DebtPaymentModal
                isOpen={debtModal.open}
                onClose={() => setDebtModal({ ...debtModal, open: false })}
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
