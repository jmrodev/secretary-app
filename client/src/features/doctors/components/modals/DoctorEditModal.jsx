import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import { Input } from '@/components/atoms/Input';
import { Switch } from '@/components/atoms/Switch';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { DoctorTariffsForm } from '@/features/doctors/components/sections/DoctorTariffsForm';
import { DoctorGoogleSettings } from '@/features/doctors/components/sections/DoctorGoogleSettings';
import { DoctorScheduleSettings } from '@/features/doctors/components/sections/DoctorScheduleSettings';
import { DoctorFiscalWizard } from '@/features/doctors/components/sections/DoctorFiscalWizard';
import { DoctorMessagesForm } from '@/features/doctors/components/sections/DoctorMessagesForm';
import { useDoctorFiscalController } from '@/features/doctors/hooks/useDoctorFiscalController';
import styles from './DoctorEditModal.module.css';

export const DoctorEditModal = ({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    data,
    settings,
    onChangeData,
    onSave,
    type = 'EDIT', // 'EDIT' or 'CREATE'

    // Schedule Props
    schedule,
    setSchedule,
    loadingSchedule,
    ScheduleBulkActionsComponent,
    ScheduleTimeBlockComponent,

    // Google Props
    connected,
    onConnectGoogle,
    onDisconnectGoogle,
    onVerifyGoogleEvents,
    onImportContacts,
    onResetSpreadsheet,
    UserFormComponent,
    MessageTemplateEditorComponent,
    t
}) => {
    const {
        generatedCsr,
        generatingCsr,
        showCsrInfo,
        generateCsr,
        hideCsrInfo,
        uploading,
        uploadCert,
        connectionStatus,
        statusDetails,
        testConnection
    } = useDoctorFiscalController(data.id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'CREATE' ? (t('add_new_user')) : t('edit_doctor_details')}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={onSave} variant="primary">
                        {type === 'CREATE' ? t('confirm') : t('save_changes')}
                    </Button>
                </>
            }
        >
            {type === 'EDIT' && (
                <div className={`${styles.DoctorEditModal__headerInfo} animate-fade-in`}>
                    <div className={`${styles.DoctorEditModal__avatar}`}>
                        <Icon name="person" size="1.5rem" />
                    </div>
                    <div className={`${styles.DoctorEditModal__doctorInfo}`}>
                        <h4 className={`${styles.DoctorEditModal__doctorName}`}>{data.full_name}</h4>
                        <p className={`${styles.DoctorEditModal__doctorSpecialty}`}>{data.specialty || t('no_specialty')}</p>
                    </div>
                </div>
            )}

            {type === 'EDIT' && (
                <TabNav className={`${styles.DoctorEditModal__tabs}`}>
                    {[
                        { id: 'tariffs', label: t('tariffs'), icon: 'payments' },
                        { id: 'schedule', label: t('schedule'), icon: 'calendar_today' },
                        { id: 'messages', label: t('messages'), icon: 'chat' },
                        { id: 'google', label: t('integrations'), icon: 'language' },
                        { id: 'fiscal', label: t('fiscal'), icon: 'receipt_long' }
                    ].map(tab => (
                        <TabButton
                            key={tab.id}
                            isActive={activeTab === tab.id}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon name={tab.icon} size="1rem" className={`${styles.DoctorEditModal__tabIcon}`} />
                            {tab.label}
                        </TabButton>
                    ))}
                </TabNav>
            )}

            {type === 'CREATE' && (
                <div className={`${styles.DoctorEditModal__content} animate-fade-in`}>
                    <UserFormComponent
                        type="CREATE"
                        formData={data}
                        setFormData={onChangeData}
                    />
                </div>
            )}
            {type === 'EDIT' && (
                <div className={`${styles.DoctorEditModal__content} animate-fade-in`}>
                    {activeTab === 'tariffs' && (
                        <DoctorTariffsForm
                            data={data}
                            settings={settings}
                            onChange={onChangeData}
                            t={t}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <div className={`${styles.DoctorEditModal__scheduleConfig}`}>
                            <div className={`${styles.DoctorEditModal__durationGrid}`}>
                                <FormGroup label={t('appointment_duration_min')}>
                                    <Input
                                        type="number"
                                        value={data.appointment_duration}
                                        onChange={e => onChangeData({ appointment_duration: e.target.value })}
                                    />
                                </FormGroup>
                                <FormGroup label={t('break_duration_min')}>
                                    <Input
                                        type="number"
                                        value={data.break_duration}
                                        onChange={e => onChangeData({ break_duration: e.target.value })}
                                    />
                                </FormGroup>
                            </div>

                            <div className={`${styles.DoctorEditModal__overturnSection}`}>
                                <h4 className={`${styles.DoctorEditModal__overturnTitle}`}>
                                    <Icon name="schedule" size="1rem" /> {t('overturn_range_title')}
                                </h4>
                                <div className={`${styles.DoctorEditModal__overturnGrid}`}>
                                    <FormGroup label={t('overturn_start_label')}>
                                        <Input
                                            type="time"
                                            value={data.overturn_start_time}
                                            onChange={e => onChangeData({ overturn_start_time: e.target.value })}
                                        />
                                    </FormGroup>
                                    <FormGroup label={t('overturn_end_label')}>
                                        <Input
                                            type="time"
                                            value={data.overturn_end_time}
                                            onChange={e => onChangeData({ overturn_end_time: e.target.value })}
                                        />
                                    </FormGroup>
                                </div>
                                <div className={`${styles.DoctorEditModal__overturnFooter}`}>
                                    <Switch
                                        label={t('force_hour_alignment_label')}
                                        checked={data.force_hour_alignment}
                                        onChange={val => onChangeData({ force_hour_alignment: val })}
                                    />
                                    <p className={`${styles.DoctorEditModal__overturnHelp}`}>
                                        {t('force_hour_alignment_help')}
                                    </p>
                                </div>
                            </div>

                            <DoctorScheduleSettings
                                doctorId={data.id}
                                schedule={schedule}
                                setSchedule={setSchedule}
                                loading={loadingSchedule}
                                ScheduleBulkActionsComponent={ScheduleBulkActionsComponent}
                                ScheduleTimeBlockComponent={ScheduleTimeBlockComponent}
                            />
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <DoctorMessagesForm
                            data={data}
                            onChange={onChangeData}
                            settings={settings}
                            MessageTemplateEditorComponent={MessageTemplateEditorComponent}
                            t={t}
                        />
                    )}

                    {activeTab === 'google' && (
                        <DoctorGoogleSettings
                            connected={connected}
                            onConnect={onConnectGoogle}
                            onDisconnect={onDisconnectGoogle}
                            onVerifyCalendar={onVerifyGoogleEvents}
                            onImportContacts={onImportContacts}
                            onResetSpreadsheet={onResetSpreadsheet}
                        />
                    )}

                    {activeTab === 'fiscal' && (
                        <DoctorFiscalWizard
                            data={data}
                            onChangeData={onChangeData}

                            generatedCsr={generatedCsr}
                            generatingCsr={generatingCsr}
                            uploading={uploading}
                            connectionStatus={connectionStatus}
                            statusDetails={statusDetails}

                            onGenerateCsr={generateCsr}
                            onUploadCert={uploadCert}
                            onTestConnection={testConnection}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};


