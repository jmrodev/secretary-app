
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
                    <PatientMedications patientId={patientDetails.id} />
                </PatientDetailsView>
            ) : (
                // --- LIST VIEW ---
                <>
                    <header className="patients__header">
                        <div>
                            <h1 className="patients__title">{t('patients')}</h1>
                            <p className="patients__subtitle">{t('patients_subtitle') || 'Administración completa de fichas médicas de pacientes.'}</p>
                        </div>
                    </header>

                    <TabNav className="patients__nav">
                        <TabButton
                            isActive={activeTab === 'list'}
                            onClick={() => setActiveTab('list')}
                        >
                            <Icon name="PATIENTS" size="1.2rem" className="mr-2" />
                            {t('active_list') || 'Lista Activa'}
                        </TabButton>
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <TabButton
                                isActive={activeTab === 'recycle'}
                                onClick={() => { setActiveTab('recycle'); fetchRecycleBin(); }}
                            >
                                <Icon name="DELETE" size="1.2rem" className="mr-2" />
                                {t('recycle_bin') || 'Papelera'}
                                {recycleItems.length > 0 && <span className="patients__dot-badge">{recycleItems.length}</span>}
                            </TabButton>
                        )}
                    </TabNav>

                    <section className="patients__action-bar">
                        <div className="action-bar__search">
                            {activeTab === 'list' && (
                                <SearchBar
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t('search_placeholder') || "Buscar..."}
                                    className="action-bar__search"
                                />
                            )}
                        </div>

                        <div className="action-bar__tools">
                            <Button variant="ghost" onClick={() => { fetchPatients(); fetchRecycleBin(); }} icon={<Icon name="SYNC" size="1.2rem" />} />
                            <Button variant="ghost" onClick={() => setShowRatingInfo(true)} icon={<Icon name="INFO" size="1.2rem" />} />
                            {(user.role === 'admin' || user.role === 'secretary') && activeTab === 'list' && (
                                <Button variant="primary" onClick={handleNewClick} icon={<Icon name="ADD" size="1.2rem" />}>
                                    {t('new') || 'Nuevo'}
                                </Button>
                            )}
                        </div>
                    </section>


                    {activeTab === 'list' ? (
                        <div className="patients-list">
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
                    ) : (
                        <PatientRecycleBin
                            recycleItems={recycleItems}
                            loading={loading}
                            onRestore={() => { /* Implementation pending */ }}
                        />
                    )}
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
