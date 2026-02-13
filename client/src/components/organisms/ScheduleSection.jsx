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
    onDateSelect,
    showOutOfHours,
    setShowOutOfHours
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
                    <DaySchedule
                        date={selectedDate}
                        onDateSelect={onDateSelect}
                        appointments={selectedDoctor ? appointments.filter(a => a.doctor_id === selectedDoctor.id) : appointments}
                        onSlotClick={onSlotClick}
                        doctor={selectedDoctor}
                        schedule={doctorSchedule}
                        holidays={holidays}
                        showOutOfHours={showOutOfHours}
                        setShowOutOfHours={setShowOutOfHours}
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
