import React from 'react';
import { DaySchedule } from './DaySchedule.jsx';
import styles from './ScheduleSection.module.css';

const EMPTY_ARRAY = [];

/**
 * ScheduleSection (Executor Component).
 * Main content area for viewing the daily agenda or management lists.
 */
export const ScheduleSection = ({
    activeTab: _activeTab, selectedDate, selectedDoctor, viewDoctorId, appointments = EMPTY_ARRAY,
    doctorSchedule = EMPTY_ARRAY, holidays = EMPTY_ARRAY, onSlotClick,
    onDateSelect, showOutOfHours, setShowOutOfHours, onNextFreeSlot, className,
    loading = false
}) => {
    const getDoctorThemeModifier = () => viewDoctorId ? `schedule-section--doctor-${Number(viewDoctorId) % 10}` : '';
    const variantClass = styles.ScheduleSection__container;
    const themedClass = viewDoctorId ? "schedule-section__container--themed" : "";

    return (
        <section className={`${styles.ScheduleSection__root} ${variantClass} ${getDoctorThemeModifier()} ${themedClass} ${className || ''}`}>
            <DaySchedule
                date={selectedDate} onDateSelect={onDateSelect}
                appointments={selectedDoctor ? appointments.filter(a => a.doctor_id === selectedDoctor.id) : appointments}
                onSlotClick={onSlotClick} doctor={selectedDoctor} schedule={doctorSchedule}
                holidays={holidays} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                onNextFreeSlot={onNextFreeSlot}
                isLoading={loading}
            />
        </section>
    );
};

