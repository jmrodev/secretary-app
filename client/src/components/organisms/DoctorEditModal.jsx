
import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import TabButton from '../atoms/TabButton';
import DoctorTariffsForm from '../molecules/DoctorTariffsForm';
import DoctorGoogleSettings from '../molecules/DoctorGoogleSettings';
import DoctorScheduleSettings from '../organisms/DoctorScheduleSettings';

const DoctorEditModal = ({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    data,
    settings,
    onChangeData,
    onSave, // handler for saving everything

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

    t
}) => {

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_doctor_details')}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={onSave}>
                        {t('save_changes')}
                    </Button>
                </>
            }
        >
            <div className="tabs-container mb-6">
                <TabButton
                    isActive={activeTab === 'tariffs'}
                    onClick={() => onTabChange('tariffs')}
                >
                    💰 Tarifas
                </TabButton>
                <TabButton
                    isActive={activeTab === 'schedule'}
                    onClick={() => onTabChange('schedule')}
                >
                    📅 Horarios
                </TabButton>
                <TabButton
                    isActive={activeTab === 'google'}
                    onClick={() => onTabChange('google')}
                >
                    🌐 Google
                </TabButton>
            </div>

            <div className="animate-fadeIn">
                {activeTab === 'tariffs' && (
                    <DoctorTariffsForm
                        data={data}
                        settings={settings}
                        onChange={onChangeData}
                        t={t}
                    />
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                            <FormGroup label="Duración Turno (min)">
                                <Input type="number" value={data.appointment_duration} onChange={e => onChangeData({ appointment_duration: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Descanso (min)">
                                <Input type="number" value={data.break_duration} onChange={e => onChangeData({ break_duration: e.target.value })} />
                            </FormGroup>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-700 mb-3">{t('overturn_range_title') || '🕒 Horario Sobreturnos (Fuera de Horario)'}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormGroup label={t('overturn_start_label') || 'Inicio Sobreturnos'}>
                                    <Input type="time" value={data.overturn_start_time} onChange={e => onChangeData({ overturn_start_time: e.target.value })} />
                                </FormGroup>
                                <FormGroup label={t('overturn_end_label') || 'Fin Sobreturnos'}>
                                    <Input type="time" value={data.overturn_end_time} onChange={e => onChangeData({ overturn_end_time: e.target.value })} />
                                </FormGroup>
                            </div>
                            <div className="mt-4 pt-3 border-t border-blue-100">
                                <Switch
                                    label={t('force_hour_alignment_label') || "Coordinar con minuto cero (:00)"}
                                    checked={data.force_hour_alignment}
                                    onChange={val => onChangeData({ force_hour_alignment: val })}
                                />
                                <p className="text-[10px] text-blue-500 mt-1 italic ml-11">
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

                {activeTab === 'google' && (
                    <DoctorGoogleSettings
                        connected={connected}
                        onConnect={onConnectGoogle}
                        onDisconnect={onDisconnectGoogle}
                        onVerifyCalendar={onVerifyGoogleEvents}
                        onImportContacts={onImportContacts}
                    />
                )}
            </div>
        </Modal>
    );
};

export default DoctorEditModal;
