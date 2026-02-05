
import React from 'react';
import { usePatientsPageController } from '../controllers/usePatientsPageController';
import Button from '../components/atoms/Button';

// Organisms
import MainLayout from '../components/templates/MainLayout';
import PatientList from '../components/organisms/PatientList';
import PatientDetailsView from '../components/organisms/PatientDetailsView';
import PatientRecycleBin from '../components/organisms/PatientRecycleBin';
import PatientForm from '../components/organisms/PatientForm';
import PatientMedications from '../components/organisms/PatientMedications';
import './Patients.css';

// Molecules
import PatientManagerModal from '../components/molecules/PatientManagerModal';
import Modal from '../components/molecules/Modal';
import CurrencyInput from '../components/atoms/CurrencyInput';
import QRCodeModal from '../components/molecules/QRCodeModal';
import DebtPaymentModal from '../components/molecules/DebtPaymentModal';

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

    if (loading) return <div className="centered-loader"><div className="status-display__spinner"></div><p>{t('loading')}</p></div>;

    return (
        <MainLayout wide>
            {detailsLoading ? (
                <div className="centered-loader"><div className="status-display__spinner"></div></div>
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

                    <nav className="patients__nav">
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'list' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('list')}
                        >
                            📋 {t('active_list') || 'Lista Activa'}
                        </Button>
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <Button
                                variant="ghost"
                                className={`tab-nav__item ${activeTab === 'recycle' ? 'tab-nav__item--active' : ''}`}
                                onClick={() => { setActiveTab('recycle'); fetchRecycleBin(); }}
                            >
                                🗑️ {t('recycle_bin') || 'Papelera'}
                                {recycleItems.length > 0 && <span className="patients__dot-badge">{recycleItems.length}</span>}
                            </Button>
                        )}
                    </nav>

                    <section className="patients__action-bar">
                        <div className="action-bar__search">
                            {activeTab === 'list' && (
                                <div className="search-box__wrapper">
                                    <span className="search-box__icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder={t('search_placeholder') || "Buscar..."}
                                        className="search-box__input"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="action-bar__tools">
                            <Button variant="ghost" onClick={() => { fetchPatients(); fetchRecycleBin(); }}>🔄</Button>
                            <Button variant="ghost" onClick={() => setShowRatingInfo(true)}>ℹ️</Button>
                            {(user.role === 'admin' || user.role === 'secretary') && activeTab === 'list' && (
                                <Button variant="primary" onClick={handleNewClick}>
                                    ✨ {t('new') || 'Nuevo'}
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

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <span className="pagination__info">
                                        {t('showing')} {patients.length} {t('of')} {totalCount} {t('patients')}
                                    </span>
                                    <div className="pagination__controls">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            ← {t('previous')}
                                        </Button>
                                        <span className="pagination__page-indicator">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        >
                                            {t('next')} →
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                onConfirm={handlePayDebt}
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
