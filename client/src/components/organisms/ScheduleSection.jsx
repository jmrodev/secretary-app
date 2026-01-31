import React from 'react';
import Button from '../atoms/Button';
import DaySchedule from './DaySchedule';
import HolidayList from '../molecules/HolidayList';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import './ScheduleSection.css';

const ScheduleSection = ({
    activeTab,
    selectedDate,
    selectedDoctor, // object with doctor details
    viewDoctorId,
    appointments = [],
    doctorSchedule = [],
    holidays = [],
    onSlotClick,
    onDeleteHoliday,
    showForm,
    onToggleForm,
    onSearchPatientId,
    searchPatientId,
    onCreatePatient,
    onNextFreeSlot,
    onSyncDayToGoogle,
    onDateSelect,

}) => {
    // Helper to determine styling based on doctor ID
    const getDoctorThemeModifier = () => {
        return viewDoctorId ? `schedule-section--doctor-${Number(viewDoctorId) % 10}` : '';
    };

    const getContainerModifier = () => {
        return viewDoctorId ? "schedule-section__container--themed" : "";
    };

    return (
        <div className={`schedule-section ${getDoctorThemeModifier()}`}>
            {activeTab === 'calendar' ? (
                <div className={`schedule-section__container ${getContainerModifier()}`}>
                    <div className="schedule-section__header">
                        <div className="schedule-section__filter-group">
                            <label className={`schedule-section__label ${viewDoctorId ? 'schedule-section__label--themed' : ''}`}>
                                Buscar Historial de Paciente
                            </label>
                            <PatientSearchSelect
                                value={searchPatientId}
                                placeholder="🔍 Buscar por Nombre/DNI..."
                                onChange={onSearchPatientId}
                                onCreatePatient={onCreatePatient}
                            />
                        </div>
                        <div className="schedule-section__actions">
                            <Button
                                variant="secondary"
                                className={`schedule-section__action-btn ${showForm ? 'schedule-section__action-btn--highlight' : ''}`}
                                onClick={onToggleForm}
                            >
                                {showForm ? <span>❌ Cancelar</span> : <span>✨ Nuevo Turno</span>}
                            </Button>
                            <Button
                                variant="secondary"
                                className="schedule-section__action-btn"
                                onClick={onNextFreeSlot}
                                title="Próximo turno libre"
                            >
                                <span>🔍</span> Próximo Libre
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => onSyncDayToGoogle && onSyncDayToGoogle()}
                                title="Actualizar Google Calendar con los turnos del día"
                                className="schedule-section__sync-btn"
                            >
                                🔄
                            </Button>
                        </div>
                    </div>

                    <DaySchedule
                        date={selectedDate}
                        onDateSelect={onDateSelect}
                        appointments={selectedDoctor ? appointments.filter(a => a.doctor_id === selectedDoctor.id) : appointments}
                        onSlotClick={onSlotClick}
                        doctor={selectedDoctor}
                        schedule={doctorSchedule}
                    />
                </div>
            ) : (
                <div className="schedule-section__card">
                    <h3 className="schedule-section__title">📋 Lista de Días Cerrados</h3>
                    <div className="schedule-section__content">
                        <HolidayList holidays={holidays} onDelete={onDeleteHoliday} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleSection;
