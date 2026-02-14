
import React from 'react';
import Calendar from './Calendar';
import HolidayForm from '../molecules/HolidayForm';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import './CalendarSection.css';

const CalendarSection = ({
    activeTab,
    selectedDate,
    onDateSelect,
    appointments = [],
    calendarStats = {},
    holidays = [],
    onAddHoliday,
    showOutOfHours,
    // New props for moved header
    viewDoctorId,
    onSearchPatientId,
    searchPatientId,
    onCreatePatient,
    onNextFreeSlot,
    onSyncDayToGoogle,
    className = ""
}) => {
    return (
        <div className={`calendar-section ${className}`}>
            {(activeTab === 'calendar' || activeTab === 'monthly') ? (
                <>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={onDateSelect}
                        appointments={appointments}
                        calendarStats={calendarStats}
                        holidays={holidays}
                        showOutOfHours={showOutOfHours}
                    />

                    {activeTab === 'calendar' && (
                        <div className="flex flex-col gap-5 mt-5">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="search" size="1rem" />
                                    Buscar Historial
                                </h3>
                                <div className="calendar-section__filter-group">
                                    <PatientSearchSelect
                                        value={searchPatientId}
                                        placeholder="Nombre o DNI..."
                                        onChange={onSearchPatientId}
                                        onCreatePatient={onCreatePatient}
                                    />
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1rem" />
                                    Herramientas
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 justify-center"
                                        onClick={onNextFreeSlot}
                                        icon={<Icon name="search" size="1.1rem" />}
                                    >
                                        Próximo Libre
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => onSyncDayToGoogle && onSyncDayToGoogle()}
                                        title="Sincronizar Google Calendar"
                                        className="px-3"
                                        icon={<Icon name="sync" size="1.1rem" />}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="dashboard-card holiday-card">
                    <h3 className="dashboard-card__title">
                        <Icon name="event_busy" size="1rem" />
                        Bloquear Agenda
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Crea un feriado o licencia para bloquear turnos en los días seleccionados.
                    </p>
                    <HolidayForm onAdd={onAddHoliday} />
                </div>
            )}
        </div>
    );
};

export default CalendarSection;
