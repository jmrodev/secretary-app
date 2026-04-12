import React from 'react';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import DoctorCard from './DoctorCard';
import DoctorEditModal from './DoctorEditModal';
import SearchBar from '@/components/molecules/SearchBar';
import './DoctorsInfo.css';

const DoctorsManager = ({
    t,
    currentUser,
    loading,
    searchTerm,
    setSearchTerm,
    filteredDoctors,
    modalState,
    handlers,
    settings
}) => {
    return (
        <section className="doctors-manager">
            <header className="dashboard-header animate-fadeIn">
                <h1 className="dashboard-header__title">{t('doctors_title')}</h1>
                <p className="dashboard-header__subtitle">{t('doctors_subtitle') || 'Administra el personal médico y sus configuraciones.'}</p>
            </header>

            <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                    <Icon name="medical_services" size="1.2rem" />
                    {filteredDoctors.length} {t('doctors_count') || 'Médicos activos'}
                </div>
            </div>

            {loading ? (
                <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
            ) : (
                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="search" size="1.2rem" />
                                {t('search') || 'Buscar'}
                            </h3>
                            <SearchBar
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('search_doctors_placeholder')}
                            />
                        </div>

                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="build" size="1.2rem" />
                                {t('actions') || 'Acciones'}
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    className="justify-start w-full"
                                    onClick={() => handlers.onEditDoctor(null)}
                                    icon={<Icon name="add" size="1.1rem" />}
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
                                        <Icon name="medical_services" size="3rem" />
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
                        type={modalState.type}
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
        </section>
    );
};

export default DoctorsManager;
