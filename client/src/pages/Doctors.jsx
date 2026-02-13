import React from 'react';
import { useDoctorsPageController } from '../controllers/useDoctorsPageController';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import Icon from '../components/atoms/Icon';
import MainLayout from '../components/templates/MainLayout';
import DoctorCard from '../components/molecules/DoctorCard';
import DoctorEditModal from '../components/organisms/DoctorEditModal';
import SearchBar from '../components/molecules/SearchBar';
import './Doctors.css';

const Doctors = () => {
    const {
        t,
        currentUser,
        loading,
        searchTerm, setSearchTerm,
        filteredDoctors,
        modalState,
        handlers,
        settings
    } = useDoctorsPageController();

    return (
        <MainLayout wide>
            <div className="doctors-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('doctors_title')}</h1>
                    <p className="dashboard-header__subtitle">{t('doctors_subtitle') || 'Administra el personal médico y sus configuraciones.'}</p>
                </header>

                <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                    {/* Placeholder for future tabs if needed */}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted">
                        <Icon name="DOCTOR" size="1.2rem" />
                        {filteredDoctors.length} {t('doctors_count') || 'Médicos activos'}
                    </div>
                </div>

                {loading ? (
                    <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
                ) : (
                    <div className="dashboard-grid animate-fadeIn">
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">🔍 {t('search') || 'Buscar'}</h3>
                                <SearchBar
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t('search_doctors_placeholder')}
                                />
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant="outline"
                                        className="justify-start w-full"
                                        onClick={handlers.fetchDoctors}
                                        icon={<Icon name="SYNC" size="1.2rem" />}
                                    >
                                        {t('refresh') || 'Actualizar'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="justify-start w-full"
                                        onClick={() => handlers.onEditDoctor(null)}
                                        icon={<Icon name="ADD" size="1.2rem" />}
                                    >
                                        {t('new') || 'Nuevo'}
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        <main className="dashboard-main">
                            <div className="doctors-page__grid">
                                {filteredDoctors.length === 0 ? (
                                    <div className="doctors-page__empty-state">
                                        <div className="doctors-page__empty-icon">
                                            <Icon name="DOCTOR" size="3rem" />
                                        </div>
                                        <p className="doctors-page__empty-text">{t('no_doctors_found')}</p>
                                    </div>
                                ) : filteredDoctors.map(doctor => (
                                    <DoctorCard
                                        key={doctor.id}
                                        doctor={doctor}
                                        currentUser={currentUser}
                                        onEdit={handlers.onEditDoctor}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </main>
                    </div>
                )}

                {
                    modalState.isOpen && (
                        <DoctorEditModal
                            isOpen={modalState.isOpen}
                            onClose={handlers.onCloseModal}
                            activeTab={modalState.activeTab}
                            onTabChange={handlers.onTabChange}
                            data={modalState.data}
                            settings={settings}
                            onChangeData={handlers.onFormDataChange}
                            onSave={handlers.onSaveDoctor}

                            schedule={modalState.schedule}
                            setSchedule={handlers.onScheduleChange}
                            loadingSchedule={modalState.loadingSchedule}

                            connected={modalState.connected}
                            onConnectGoogle={handlers.onConnectGoogle}
                            onDisconnectGoogle={handlers.onDisconnectGoogle}
                            onVerifyGoogleEvents={handlers.onVerifyGoogleEvents}
                            onImportContacts={handlers.onImportContacts}
                            onResetSpreadsheet={handlers.onResetSpreadsheet}

                            t={t}
                        />
                    )
                }
            </div >
        </MainLayout >
    );
};

export default Doctors;
