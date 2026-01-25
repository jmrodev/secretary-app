import Button from '../atoms/Button';
import DaySchedule from './DaySchedule';
import HolidayList from '../molecules/HolidayList';
import PatientSearchSelect from '../molecules/PatientSearchSelect';

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
    onRefreshGoogle,
    onClearSlotHistory,

}) => {
    // Helper to determine styling based on doctor ID
    const getDoctorThemeClass = () => {
        return viewDoctorId ? `doctor-color-${Number(viewDoctorId) % 10}` : '';
    };

    const getDoctorBgClass = () => {
        return viewDoctorId ? "doctor-themed-bg p-4 rounded-2xl border" : "";
    };

    return (
        <div className={`schedule-section ${getDoctorThemeClass()}`}>
            {activeTab === 'calendar' ? (
                <div className={`schedule-section__container ${getDoctorBgClass()}`}>
                    <div className="schedule-section__header mb-4">
                        <div className="schedule-section__filters filter-group patient-search-container">
                            <label className={`filter-label ${viewDoctorId ? 'doctor-themed-text' : ''}`}>
                                Buscar Historial de Paciente
                            </label>
                            <PatientSearchSelect
                                value={searchPatientId}
                                placeholder="🔍 Buscar por Nombre/DNI..."
                                onChange={onSearchPatientId}
                                onCreatePatient={onCreatePatient}
                            />
                        </div>
                        <div className="schedule-section__actions flex gap-2 mt-2">
                            <Button
                                variant="secondary"
                                className={`flex-1 ${showForm ? 'ring-2 ring-blue-200' : ''}`}
                                onClick={onToggleForm}
                            >
                                {showForm ? <span>❌ Cancelar</span> : <span>✨ Nuevo Turno</span>}
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={onNextFreeSlot}
                                title="Próximo turno libre"
                            >
                                <span>🔍</span> Próximo Libre
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={onRefreshGoogle}
                                title="Refrescar Google Calendar"
                                style={{ maxWidth: '50px' }}
                            >
                                🔄
                            </Button>
                        </div>
                    </div>

                    <DaySchedule
                        date={selectedDate}
                        appointments={selectedDoctor ? appointments.filter(a => a.doctor_id === selectedDoctor.id) : appointments}
                        onSlotClick={onSlotClick}
                        doctor={selectedDoctor}
                        schedule={doctorSchedule}
                    />
                </div>
            ) : (
                <div className="schedule-section__card card h-full animate-in overflow-hidden flex flex-col">
                    <h3 className="config-section-title">📋 Lista de Días Cerrados</h3>
                    <div className="flex-1 overflow-y-auto pr-2">
                        <HolidayList holidays={holidays} onDelete={onDeleteHoliday} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleSection;
