
import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import DoctorTariffsForm from '../molecules/DoctorTariffsForm';
import DoctorGoogleSettings from '../molecules/DoctorGoogleSettings';
// Note: reusing the existing organism/molecule for schedule if suitable, or checking if I need to refactor it. 
// DoctorScheduleSettings seems to already exist as organism.
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
                <Button
                    variant="ghost"
                    className={`tab-btn ${activeTab === 'tariffs' ? 'active' : ''}`}
                    onClick={() => onTabChange('tariffs')}
                >
                    💰 Tarifas
                </Button>
                <Button
                    variant="ghost"
                    className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => onTabChange('schedule')}
                >
                    📅 Horarios
                </Button>
                <Button
                    variant="ghost"
                    className={`tab-btn ${activeTab === 'google' ? 'active' : ''}`}
                    onClick={() => onTabChange('google')}
                >
                    🌐 Google
                </Button>
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
