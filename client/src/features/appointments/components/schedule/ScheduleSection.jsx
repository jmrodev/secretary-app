import React from 'react';
import DaySchedule from './DaySchedule.jsx';
import HolidayList from '../sections/HolidayList.jsx';
import Icon from '@/components/atoms/Icon';
import './ScheduleSection.css';

const EMPTY_ARRAY = [];

/**
 * ScheduleSection (Executor Component).
 * Main content area for viewing the daily agenda or management lists.
 */
const ScheduleSection = ({
    activeTab, selectedDate, selectedDoctor, viewDoctorId, appointments = EMPTY_ARRAY,
    doctorSchedule = EMPTY_ARRAY, holidays = EMPTY_ARRAY, onSlotClick, onDeleteHoliday,
    onDateSelect, showOutOfHours, setShowOutOfHours, onNextFreeSlot, className,
    loading = false
}) => {
    const getDoctorThemeModifier = () => viewDoctorId ? `schedule-section--doctor-${Number(viewDoctorId) % 10}` : '';
    const isCalendar = activeTab === 'calendar' || activeTab === 'agenda'; // Added agenda for safety
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
                    isLoading={loading}
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
