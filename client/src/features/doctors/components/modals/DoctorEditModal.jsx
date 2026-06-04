import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import Input from '@/components/atoms/Input';
import Switch from '@/components/atoms/Switch';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import DoctorTariffsForm from '@/features/doctors/components/sections/DoctorTariffsForm';
import DoctorGoogleSettings from '@/features/doctors/components/sections/DoctorGoogleSettings';
import DoctorScheduleSettings from '@/features/doctors/components/sections/DoctorScheduleSettings';
import DoctorFiscalSettings from '@/features/doctors/components/sections/DoctorFiscalSettings';
import DoctorMessagesForm from '@/features/doctors/components/sections/DoctorMessagesForm';
import { UserForm } from '@/features/users';
import { useDoctorFiscalController } from '@/features/doctors/hooks/useDoctorFiscalController';
import styles from './DoctorEditModal.module.css';

const DoctorEditModal = ({
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

    // Google Props
    connected,
    onConnectGoogle,
    onDisconnectGoogle,
    onVerifyGoogleEvents,
    onImportContacts,
    onResetSpreadsheet,
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
            title={type === 'CREATE' ? (t('add_new_user') || 'Agregar Nuevo Médico') : t('edit_doctor_details')}
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
                <div className={`${styles.headerInfo} animate-fade-in`}>
                    <div className={`${styles.avatar}`}>
                        <Icon name="person" size="1.5rem" />
                    </div>
                    <div className={`${styles.doctorInfo}`}>
                        <h4 className={`${styles.doctorName}`}>{data.full_name}</h4>
                        <p className={`${styles.doctorSpecialty}`}>{data.specialty || t('no_specialty')}</p>
                    </div>
                </div>
            )}

            {type === 'EDIT' && (
                <TabNav className={`${styles.tabs}`}>
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
                            <Icon name={tab.icon} size="1rem" className={`${styles.tabIcon}`} />
                            {tab.label}
                        </TabButton>
                    ))}
                </TabNav>
            )}

            {type === 'CREATE' && (
                <div className={`${styles.content} animate-fade-in`}>
                    <UserForm
                        type="CREATE"
                        formData={data}
                        setFormData={onChangeData}
                    />
                </div>
            )}
            {type === 'EDIT' && (
                <div className={`${styles.content} animate-fade-in`}>
                    {activeTab === 'tariffs' && (
                        <DoctorTariffsForm
                            data={data}
                            settings={settings}
                            onChange={onChangeData}
                            t={t}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <div className={`${styles.scheduleConfig}`}>
                            <div className={`${styles.durationGrid}`}>
                                <FormGroup label="Duración Turno (min)">
                                    <Input
                                        type="number"
                                        value={data.appointment_duration}
                                        onChange={e => onChangeData({ appointment_duration: e.target.value })}
                                    />
                                </FormGroup>
                                <FormGroup label="Descanso (min)">
                                    <Input
                                        type="number"
                                        value={data.break_duration}
                                        onChange={e => onChangeData({ break_duration: e.target.value })}
                                    />
                                </FormGroup>
                            </div>

                            <div className={`${styles.overturnSection}`}>
                                <h4 className={`${styles.overturnTitle}`}>
                                    <Icon name="schedule" size="1rem" /> {t('overturn_range_title') || 'Horario Sobreturnos (Fuera de Horario)'}
                                </h4>
                                <div className={`${styles.overturnGrid}`}>
                                    <FormGroup label={t('overturn_start_label') || 'Inicio Sobreturnos'}>
                                        <Input
                                            type="time"
                                            value={data.overturn_start_time}
                                            onChange={e => onChangeData({ overturn_start_time: e.target.value })}
                                        />
                                    </FormGroup>
                                    <FormGroup label={t('overturn_end_label') || 'Fin Sobreturnos'}>
                                        <Input
                                            type="time"
                                            value={data.overturn_end_time}
                                            onChange={e => onChangeData({ overturn_end_time: e.target.value })}
                                        />
                                    </FormGroup>
                                </div>
                                <div className={`${styles.overturnFooter}`}>
                                    <Switch
                                        label={t('force_hour_alignment_label') || "Coordinar con minuto cero (:00)"}
                                        checked={data.force_hour_alignment}
                                        onChange={val => onChangeData({ force_hour_alignment: val })}
                                    />
                                    <p className={`${styles.overturnHelp}`}>
                                        {t('force_hour_alignment_help') || "Si un turno arranca 8:15, el siguiente será clavado a las 9:00, luego 10:00, etc."}
                                    </p>
                                </div>
                            </div>

                            <DoctorScheduleSettings
                                doctorId={data.id}
                                schedule={schedule}
                                setSchedule={setSchedule}
                                loading={loadingSchedule}
                            />
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <DoctorMessagesForm
                            data={data}
                            onChange={onChangeData}
                            settings={settings}
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
                        <DoctorFiscalSettings
                            data={data}
                            onChangeData={onChangeData}

                            generatedCsr={generatedCsr}
                            generatingCsr={generatingCsr}
                            showCsrInfo={showCsrInfo}
                            uploading={uploading}
                            connectionStatus={connectionStatus}
                            statusDetails={statusDetails}

                            onGenerateCsr={generateCsr}
                            onUploadCert={uploadCert}
                            onTestConnection={testConnection}
                            onHideCsrInfo={hideCsrInfo}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};

export default DoctorEditModal;
