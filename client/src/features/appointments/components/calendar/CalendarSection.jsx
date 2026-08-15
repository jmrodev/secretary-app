import React from 'react';
import { Calendar } from './Calendar.jsx';
import styles from './CalendarSection.module.css';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * CalendarSection (Executor Component).
 * Side panel (or main depending on view) for monthly calendar navigation and tools.
 */
export const CalendarSection = ({
    selectedDate, onDateSelect, appointments = EMPTY_ARRAY, calendarStats = EMPTY_OBJECT, holidays = EMPTY_ARRAY,
    showOutOfHours, viewDoctorId: _viewDoctorId, onSearchPatientId: _onSearchPatientId, searchPatientId: _searchPatientId,
    onCreatePatient: _onCreatePatient, onNextFreeSlot: _onNextFreeSlot, onSyncDayToGoogle: _onSyncDayToGoogle, className = ""
}) => {

    return (
        <div className={`${styles.root} ${className}`}>
            <Calendar
                selectedDate={selectedDate} onDateSelect={onDateSelect}
                appointments={appointments} calendarStats={calendarStats}
                holidays={holidays} showOutOfHours={showOutOfHours}
                compact={true}
            />
            
        </div>
    );
};

