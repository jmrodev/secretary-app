
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

// Molecules
import PatientManagerModal from '../components/molecules/PatientManagerModal';
import Modal from '../components/molecules/Modal';
import CurrencyInput from '../components/atoms/CurrencyInput';
import QRCodeModal from '../components/molecules/QRCodeModal';

const Patients = () => {
    const controller = usePatientsPageController();
    const {
        user, t,
        patients, loading, detailsLoading,
        totalCount, currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        showCreate, setShowCreate,
        selectedPatientId, setSelectedPatientId, patientDetails,
        showRatingInfo, setShowRatingInfo,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,

        // Handlers
        fetchPatients, fetchRecycleBin,
        handleCreate,
        handleViewDetails,
        handleDeletePatient,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handlePayDebt,
        handleRatingChange,
        handleToggleNew,
        handleGenerateQR
    } = controller;

    // --- Rating Helpers ---
    const calculateFinancialRating = (debt) => {
        if (debt <= 0) return 5;
        if (debt < 1000) return 4;
        if (debt < 5000) return 3;
        if (debt < 10000) return 2;
        return 1;
    };

    const calculateAttendanceRating = (total, missed) => {
        if (!total || total === 0) return 5;
        const ratio = (total - missed) / total;
        if (ratio >= 0.95) return 5;
        if (ratio >= 0.85) return 4;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.50) return 2;
        return 1;
    };

    if (loading) return <div className="centered-loader"><div className="status-display__spinner"></div><p>{t('loading')}</p></div>;

    if (detailsLoading) {
        return (
            <MainLayout>
                <div className="centered-loader"><div className="status-display__spinner"></div></div>
            </MainLayout>
        );
    }

    // --- Details View Branch ---
    if (selectedPatientId && patientDetails) {
        return (
            <MainLayout>
                <PatientDetailsView
                    details={patientDetails}
                    t={t}
                    user={user}
                    onBack={() => setSelectedPatientId(null)}
                    onEdit={() => handleEditClick(patientDetails)}
                    onDelete={handleDeletePatient}
                    onGenerateQR={handleGenerateQR}
                    onToggleNew={handleToggleNew}
                    onPayDebt={handleOpenDebtModal}
                >
                    <PatientMedications patientId={patientDetails.id} />
                </PatientDetailsView>

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
            </MainLayout>
        );
    }

    // --- List View Branch ---
    return (
        <MainLayout
            title={t('patients')}
            subtitle={t('patients_subtitle') || 'Administración completa de fichas médicas de pacientes.'}
        >
            <nav className="tab-nav">
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
                        {recycleItems.length > 0 && <span className="dot-badge ml-2">{recycleItems.length}</span>}
                    </Button>
                )}
            </nav>

            <section className="action-bar">
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
                    {user.role === 'secretary' && activeTab === 'list' && (
                        <Button variant={showCreate ? 'secondary' : 'primary'} onClick={() => setShowCreate(!showCreate)}>
                            {showCreate ? `❌ ${t('cancel')}` : `✨ ${t('new')}`}
                        </Button>
                    )}
                </div>
            </section>

            {showCreate && (
                <div className="card mb-8 animate-fadeIn">
                    <header className="card-header border-none pb-0">
                        <h3 className="card-header__title">{t('register_new_patient')}</h3>
                    </header>
                    <PatientForm
                        onSubmit={handleCreate}
                        isEdit={false}
                        isAdmin={true}
                        insurances={insurances}
                        doctors={doctors}
                    />
                </div>
            )}

            {activeTab === 'list' ? (
                <div className="patients-list">
                    <PatientList
                        patients={patients}
                        t={t}
                        onViewDetails={handleViewDetails}
                        onOpenDebt={handleOpenDebtModal}
                        onToggleRating={handleRatingChange}
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

            {/* --- Modals --- */}
            <PatientManagerModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ ...editModal, open: false })}
                patient={editModal.data}
                onUpdate={handleUpdatePatient}
                insurances={insurances}
                doctors={doctors}
            />

            <Modal
                isOpen={debtModal.open}
                onClose={() => setDebtModal({ ...debtModal, open: false })}
                title={t('pay_debt')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDebtModal({ ...debtModal, open: false })}>{t('cancel')}</Button>
                        <Button onClick={handlePayDebt}>{t('confirm_payment')}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="input-group">
                        <label className="input-label">{t('amount')} ($)</label>
                        <CurrencyInput
                            className="input-field"
                            value={debtModal.params.amount}
                            onChange={e => setDebtModal(prev => ({ ...prev, params: { ...prev.params, amount: e.target.value } }))}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('payment_method')}</label>
                        <select
                            className="input-field"
                            value={debtModal.params.method}
                            onChange={e => setDebtModal(prev => ({ ...prev, params: { ...prev.params, method: e.target.value } }))}
                        >
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showRatingInfo}
                onClose={() => setShowRatingInfo(false)}
                title={t('rating_guide_title')}
            >
                <div className="p-2">
                    <p className="whitespace-pre-line text-main-600">
                        {t('rating_guide_body')}
                    </p>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={() => setShowRatingInfo(false)}>{t('close')}</Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Patients;
