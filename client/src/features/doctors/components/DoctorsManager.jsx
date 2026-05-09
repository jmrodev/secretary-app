import React from 'react';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import DoctorCard from '@/features/doctors/components/DoctorCard';
import DoctorEditModal from '@/features/doctors/components/DoctorEditModal';
import SearchBar from '@/components/molecules/SearchBar';
import './DoctorsManager.css';

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
            <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fade-in">
                <div className="doctors-manager__counter">
                    <Icon name="medical_services" size="1.2rem" />
                    {filteredDoctors.length} {t('doctors_count') || 'Médicos activos'}
                </div>
            </div>

            {loading ? (
                <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
            ) : (
                <div className="dashboard-layout__grid animate-fade-in">
                    <aside className="dashboard-layout__sidebar">
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
                            <div className="doctors-manager__actions-group">
                                <Button
                                    variant="primary"
                                    className="doctors-manager__add-btn"
                                    onClick={() => handlers.onEditDoctor(null)}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new') || 'Nuevo'}
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <main className="dashboard-layout__main">
                        <div className="doctors-manager__grid">
                            {filteredDoctors.length === 0 ? (
                                <div className="doctors-manager__empty-state">
                                    <div className="doctors-manager__empty-icon">
                                        <Icon name="medical_services" size="3rem" />
                                    </div>
                                    <p className="doctors-manager__empty-text">{t('no_doctors_found')}</p>
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
