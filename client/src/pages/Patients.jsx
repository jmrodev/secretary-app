
import React from 'react';
import { usePatientsPageController } from '../controllers/usePatientsPageController';
// Atoms
import MainLayout from '../components/templates/MainLayout';
import Button from '../components/atoms/Button';
import CurrencyInput from '../components/atoms/CurrencyInput';
import Loading from '../components/atoms/Loading';
import TabButton from '../components/atoms/TabButton';
import Icon from '../components/atoms/Icon';

// Molecules
import PatientManagerModal from '../components/molecules/PatientManagerModal';
import Modal from '../components/molecules/Modal';
import QRCodeModal from '../components/molecules/QRCodeModal';
import DebtPaymentModal from '../components/molecules/DebtPaymentModal';
import SearchBar from '../components/molecules/SearchBar';
import Pagination from '../components/molecules/Pagination';
import TabNav from '../components/molecules/TabNav';

// Organisms
import PatientList from '../components/organisms/PatientList';
import PatientDetailsView from '../components/organisms/PatientDetailsView';
import PatientRecycleBin from '../components/organisms/PatientRecycleBin';
import PatientForm from '../components/organisms/PatientForm';
import PatientMedications from '../components/organisms/PatientMedications';
import './Patients.css';

const Patients = () => {
    const controller = usePatientsPageController();
    const {
        user, t,
        patients, loading, detailsLoading,
        totalCount, currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        selectedPatientId, setSelectedPatientId, patientDetails,
        showRatingInfo, setShowRatingInfo,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,

        handlers,
    } = controller;

    const {
        fetchPatients, fetchRecycleBin,
        handleNewClick,
        handleViewDetails,
        handleDeletePatient,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handleDebtAmountChange,
        handleDebtMethodChange,
        handlePayDebt,
        handleRatingChange,
        handleCycleRating,
        handleToggleNew,
        handleGenerateQR,
        handleGeneratePrescriptionLink,
        calculateFinancialRating,
        calculateAttendanceRating,
    } = handlers;

    return (
        <MainLayout wide>
            {loading ? (
                <Loading variant="centered" text={t('loading') || "Cargando..."} />
            ) : detailsLoading ? (
                <Loading variant="centered" />
            ) : (selectedPatientId && patientDetails) ? (
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
                        <p className="dashboard-header__subtitle">{t('patients_subtitle') || 'Administración completa de fichas médicas de pacientes.'}</p>
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
                                        {t('active_list') || 'Lista Activa'}
                                    </TabButton>
                                    {(user.role === 'admin' || user.role === 'secretary') && (
                                        <TabButton
                                            isActive={activeTab === 'recycle'}
                                            onClick={() => { setActiveTab('recycle'); fetchRecycleBin(); }}
                                            icon={<Icon name="delete" size="1.1rem" />}
                                        >
                                            {t('recycle_bin') || 'Papelera'}
                                            {recycleItems.length > 0 && <span className="patients__dot-badge">{recycleItems.length}</span>}
                                        </TabButton>
                                    )}
                                </TabNav>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="search" size="1.2rem" />
                                    {t('search') || 'Buscar'}
                                </h3>
                                <div className="patients-sidebar__search">
                                    {activeTab === 'list' && (
                                        <SearchBar
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder={t('search_placeholder') || "Nombre, DNI, obra social..."}
                                            className="action-bar__search"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1.2rem" />
                                    {t('actions') || 'Acciones'}
                                </h3>
                                <div className="patients-sidebar__tools">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => { fetchPatients(); fetchRecycleBin(); }}
                                        icon={<Icon name="sync" size="1.1rem" />}
                                    >
                                        {t('refresh') || 'Sincronizar'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setShowRatingInfo(true)}
                                        icon={<Icon name="info" size="1.1rem" />}
                                    >
                                        {t('rating_info') || 'Info de Calificación'}
                                    </Button>
                                    {(user.role === 'admin' || user.role === 'secretary') && activeTab === 'list' && (
                                        <Button
                                            variant="primary"
                                            className="w-full justify-start mt-4"
                                            onClick={handleNewClick}
                                            icon={<Icon name="add" size="1.1rem" />}
                                        >
                                            {t('new') || 'Nuevo Paciente'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        <main className="dashboard-main">

                            {activeTab === 'list' ? (
                                <div className="patients-list-view">
                                    <div className="dashboard-card no-padding">
                                        <PatientList
                                            patients={patients}
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
                                    onRestore={() => { /* Implementation pending */ }}
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
                onConfirm={() => handlers.handlePayDebt(debtModal.params)}
                amount={debtModal.params.amount}
                onAmountChange={handleDebtAmountChange}
                method={debtModal.params.method}
                onMethodChange={handleDebtMethodChange}
                t={t}
            />

            <Modal
                isOpen={showRatingInfo}
                onClose={() => setShowRatingInfo(false)}
                title={t('rating_guide_title')}
            >
                <div className="patients__rating-guide-content">
                    <p className="patients__rating-guide-text">
                        {t('rating_guide_body')}
                    </p>
                    <div className="patients__modal-actions">
                        <Button onClick={() => setShowRatingInfo(false)}>{t('close')}</Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Patients;
