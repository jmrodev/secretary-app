import React, { useMemo } from 'react';
import CalendarHeader from './CalendarHeader.jsx';
import CalendarGrid from './CalendarGrid.jsx';
import DayHeaders from '../schedule/DayHeaders.jsx';
import { useLanguage } from '@/hooks/useLanguage';
import { getNow, parseDate, createDate, getDaysInMonth, formatKeyDate } from '@/utils/core/dateUtils';
import styles from './Calendar.module.css';

/**
 * Calendar (Orchestrator Component).
 * Renders the monthly navigation grid for the agenda.
 * Refactored to separate the grid logic for better maintainability.
 */
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const Calendar = ({ 
    selectedDate, 
    onDateSelect, 
    appointments = EMPTY_ARRAY, 
    holidays = EMPTY_ARRAY, 
    calendarStats = EMPTY_OBJECT, 
    hideNavigation = false, 
    showOutOfHours = false, 
    compact = false 
}) => {
    const { t } = useLanguage();

    // Derived state for the view date
    const viewDate = parseDate(selectedDate || getNow());
    const days = getDaysInMonth(viewDate);
    const firstDay = createDate(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const months = t('months_array') || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = t('days_short_array') || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map appointments by YYYY-MM-DD key for efficient lookup in the grid
    const appointmentsByDate = useMemo(() => {
        const map = {};
        appointments.forEach(appt => {
            const dateStr = formatKeyDate(appt.appointment_date);
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(appt);
        });
        return map;
    }, [appointments]);

    // Map holidays by YYYY-MM-DD key
    const holidaysByDate = useMemo(() => {
        const map = {};
        holidays.forEach(h => {
            if (!h.date) return;
            map[formatKeyDate(h.date)] = h;
        });
        return map;
    }, [holidays]);

    const handlePrevMonth = () => {
        const newDate = createDate(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        onDateSelect(newDate);
    };

    const handleNextMonth = () => {
        const newDate = createDate(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        onDateSelect(newDate);
    };

    return (
        <div className={`${styles.root}`}>
            {!hideNavigation && (
                <CalendarHeader
                    month={months[viewDate.getMonth()]} year={viewDate.getFullYear()}
                    onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
                />
            )}
            {hideNavigation && (
                <div className={`${styles.simpleTitle}`}>
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
            )}
            <div className={`${styles.mainContainer}`}>
                <DayHeaders daysOfWeek={daysOfWeek} />
                <div className={`${styles.body}`}>
                    <CalendarGrid 
                        viewDate={viewDate}
                        selectedDate={selectedDate}
                        days={days}
                        firstDay={firstDay}
                        calendarStats={calendarStats}
                        appointmentsByDate={appointmentsByDate}
                        holidaysByDate={holidaysByDate}
                        showOutOfHours={showOutOfHours}
                        compact={compact}
                        onDateSelect={onDateSelect}
                        t={t}
                    />
                </div>
            </div>
        </div>
    );
};

export default Calendar;
