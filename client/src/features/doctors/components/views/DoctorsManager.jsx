import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import { Icon } from '@/components/atoms/Icon';
import { DoctorCard } from '@/features/doctors/components/cards/DoctorCard';
import { DoctorEditModal } from '@/features/doctors/components/modals/DoctorEditModal';
import styles from './DoctorsManager.module.css';

export const DoctorsManager = ({
    t,
    currentUser,
    loading,
    searchTerm: _searchTerm,
    setSearchTerm: _setSearchTerm,
    filteredDoctors,
    modalState,
    handlers,
    settings,
    ScheduleBulkActionsComponent,
    ScheduleTimeBlockComponent,
    UserFormComponent,
    MessageTemplateEditorComponent
}) => {
    return (
        <section className={`${styles.DoctorsManager__root}`}>
            <div className={`${styles.DoctorsManager__headerActions}`}>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlers.onEditDoctor(null)}
                    icon={<Icon name="add" size="1.1rem" />}
                >
                    {t('new') || 'Nuevo'}
                </Button>
                <div className={`${styles.DoctorsManager__counter}`}>
                    <Icon name="medical_services" size="1.2rem" />
                    <span>{filteredDoctors.length} {t('doctors_count') || 'Médicos activos'}</span>
                </div>
            </div>

            {loading ? (
                <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
            ) : (
                <div className={`${styles.DoctorsManager__grid} animate-fade-in`}>
                    {filteredDoctors.length === 0 ? (
                        <div className={`${styles.DoctorsManager__emptyState}`}>
                            <div className={`${styles.DoctorsManager__emptyIcon}`}>
                                <Icon name="medical_services" size="3rem" />
                            </div>
                            <p className={`${styles.DoctorsManager__emptyText}`}>{t('no_doctors_found')}</p>
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

                        ScheduleBulkActionsComponent={ScheduleBulkActionsComponent}
                        ScheduleTimeBlockComponent={ScheduleTimeBlockComponent}

                        UserFormComponent={UserFormComponent}
                        MessageTemplateEditorComponent={MessageTemplateEditorComponent}

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
