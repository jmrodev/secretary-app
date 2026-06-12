import React from 'react';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import DoctorCard from '@/features/doctors/components/cards/DoctorCard';
import DoctorEditModal from '@/features/doctors/components/modals/DoctorEditModal';
import styles from './DoctorsManager.module.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

const DoctorsManager = ({
    t,
    currentUser,
    loading,
    searchTerm: _searchTerm,
    setSearchTerm: _setSearchTerm,
    filteredDoctors,
    modalState,
    handlers,
    settings
}) => {
    return (
        <section className={`${styles.root}`}>
            <FeatureToolbar
                className="doctors-manager-orchestrator__top-actions"
                actions={
                    <div className="doctors-manager__toolbar-actions">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlers.onEditDoctor(null)}
                            icon={<Icon name="add" size="1.1rem" />}
                        >
                            {t('new') || 'Nuevo'}
                        </Button>
                        <div className={`${styles.counter}`}>
                            <Icon name="medical_services" size="1.2rem" />
                            <span>{filteredDoctors.length} {t('doctors_count') || 'Médicos activos'}</span>
                        </div>
                    </div>
                }
            />

            {loading ? (
                <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
            ) : (
                <div className="dashboard-layout__grid animate-fade-in">
                    <main className="dashboard-layout__main dashboard-layout__main--full">
                        <div className={`${styles.grid}`}>
                            {filteredDoctors.length === 0 ? (
                                <div className={`${styles.emptyState}`}>
                                    <div className={`${styles.emptyIcon}`}>
                                        <Icon name="medical_services" size="3rem" />
                                    </div>
                                    <p className={`${styles.emptyText}`}>{t('no_doctors_found')}</p>
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
