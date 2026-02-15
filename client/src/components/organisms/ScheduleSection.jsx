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
    setShowOutOfHours,
    className
}) => {
    // Helper to determine styling based on doctor ID
    const getDoctorThemeModifier = () => {
        return viewDoctorId ? `schedule-section--doctor-${Number(viewDoctorId) % 10}` : '';
    };

    const isCalendar = activeTab === 'calendar';
    const variantClass = isCalendar ? 'schedule-section__container' : 'schedule-section__card';
    const themedClass = (isCalendar && viewDoctorId) ? "schedule-section__container--themed" : "";

    return (
        <main className={`schedule-section ${variantClass} ${getDoctorThemeModifier()} ${themedClass} ${className || ''}`}>
            {
                isCalendar ? (
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
                ) : (
                    <>
                        <h3 className="schedule-section__title">📋 Lista de Días Cerrados</h3>
                        <div className="schedule-section__content">
                            <HolidayList holidays={holidays} onDelete={onDeleteHoliday} />
                        </div>
                    </>
                )}
        </main >
    );
};

export default ScheduleSection;
