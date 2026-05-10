import React from 'react';
import DaySchedule from '@/features/appointments/components/DaySchedule.jsx';
import HolidayList from '@/features/appointments/components/HolidayList.jsx';
import Icon from '@/components/atoms/Icon';
import './ScheduleSection.css';

/**
 * ScheduleSection (Executor Component).
 * Main content area for viewing the daily agenda or management lists.
 */
const ScheduleSection = ({
    activeTab, selectedDate, selectedDoctor, viewDoctorId, appointments = [],
    doctorSchedule = [], holidays = [], onSlotClick, onDeleteHoliday,
    onDateSelect, showOutOfHours, setShowOutOfHours, onNextFreeSlot, className
}) => {
    const getDoctorThemeModifier = () => viewDoctorId ? `schedule-section--doctor-${Number(viewDoctorId) % 10}` : '';
    const isCalendar = activeTab === 'calendar';
    const variantClass = isCalendar ? 'schedule-section__container' : 'schedule-section__card';
    const themedClass = (isCalendar && viewDoctorId) ? "schedule-section__container--themed" : "";

    return (
        <section className={`schedule-section ${variantClass} ${getDoctorThemeModifier()} ${themedClass} ${className || ''}`}>
            {isCalendar ? (
                <DaySchedule
                    date={selectedDate} onDateSelect={onDateSelect}
                    appointments={selectedDoctor ? appointments.filter(a => a.doctor_id === selectedDoctor.id) : appointments}
                    onSlotClick={onSlotClick} doctor={selectedDoctor} schedule={doctorSchedule}
                    holidays={holidays} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                    onNextFreeSlot={onNextFreeSlot}
                />
            ) : (
                <>
                    <h3 className="schedule-section__title">
                        <Icon name="list" className="schedule-section__title-icon" />
                        Lista de Días Cerrados
                    </h3>
                    <div className="schedule-section__content">
                        <HolidayList holidays={holidays} onDelete={onDeleteHoliday} />
                    </div>
                </>
            )}
        </section>
    );
};

export default ScheduleSection;
