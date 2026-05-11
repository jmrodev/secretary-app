import React, { useState, useEffect } from 'react';
import CalendarDayCell from '@/features/appointments/components/calendar/CalendarDayCell.jsx';
import CalendarHeader from '@/features/appointments/components/calendar/CalendarHeader.jsx';
import DayHeaders from '@/features/appointments/components/schedule/DayHeaders.jsx';
import { useLanguage } from '@/hooks/useLanguage';
import { isPastDay, isSameDay } from '@/utils/core/dateUtils';
import './Calendar.css';

/**
 * Calendar (Executor Component).
 * Renders the monthly navigation grid for the agenda.
 */
const Calendar = ({ selectedDate, onDateSelect, appointments = [], holidays = [], calendarStats = {}, hideNavigation = false, showOutOfHours = false, compact = false }) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date()));
    const { t } = useLanguage();

    useEffect(() => {
        if (selectedDate) queueMicrotask(() => setViewDate(new Date(selectedDate)));
    }, [selectedDate]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(viewDate);
    const months = t('months_array') || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = t('days_short_array') || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const appointmentsByDate = React.useMemo(() => {
        const map = {};
        appointments.forEach(appt => {
            const d = new Date(appt.appointment_date);
            const dateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(appt);
        });
        return map;
    }, [appointments]);

    const handlePrevMonth = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
    };

    const renderDays = () => {
        const dayElements = [];
        for (let i = 0; i < firstDay; i++) {
            dayElements.push(<div key={`empty-pre-${i}`} className="calendar-grid__cell calendar-grid__cell--empty"></div>);
        }

        for (let i = 1; i <= days; i++) {
            const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
            const isSelected = selectedDate && isSameDay(new Date(selectedDate), currentDay);
            const isToday = isSameDay(new Date(), currentDay);
            const dateStr = [currentDay.getFullYear(), String(currentDay.getMonth() + 1).padStart(2, '0'), String(currentDay.getDate()).padStart(2, '0')].join('-');
            const dayStats = calendarStats[dateStr] || {};
            
            // Use the pre-calculated map instead of filtering on each day
            const dayAppts = appointmentsByDate[dateStr] || [];
            
            const bookedInCount = (dayStats.bookedIn !== undefined) ? dayStats.bookedIn : dayAppts.filter(a => !a.is_out_of_hours).length;
            const bookedOutCount = (dayStats.bookedOut !== undefined) ? dayStats.bookedOut : dayAppts.filter(a => a.is_out_of_hours).length;
            const count = (dayStats.bookedIn !== undefined && dayStats.bookedOut !== undefined) ? (dayStats.bookedIn + dayStats.bookedOut) : dayAppts.length;
            const isHolidayObj = holidays && holidays.find(h => h.date && isSameDay(new Date(h.date), currentDay));

            dayElements.push(
                <CalendarDayCell
                    key={i} day={i} isSelected={isSelected} isToday={isToday} isPast={isPastDay(currentDay)}
                    isHoliday={!!isHolidayObj} holidayDescription={isHolidayObj?.description || ''}
                    appointmentCount={count} bookedInCount={bookedInCount} bookedOutCount={bookedOutCount}
                    freeInCount={dayStats.freeIn} freeOutCount={dayStats.freeOut} showOutOfHours={showOutOfHours}
                    onClick={() => onDateSelect(currentDay)} isCurrentMonth={true} t={t} compact={compact}
                />
            );
        }

        // Fill to 6 rows
        const totalCells = 42;
        const currentCount = dayElements.length;
        for (let i = 0; i < (totalCells - currentCount); i++) {
            dayElements.push(<div key={`empty-post-${i}`} className="calendar-grid__cell calendar-grid__cell--empty"></div>);
        }
        return dayElements;
    };

    return (
        <div className="calendar-grid">
            {!hideNavigation && (
                <CalendarHeader
                    month={months[viewDate.getMonth()]} year={viewDate.getFullYear()}
                    onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
                />
            )}
            {hideNavigation && (
                <div className="calendar-grid__simple-title">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
            )}
            <div className="calendar-grid__main-container">
                <DayHeaders daysOfWeek={daysOfWeek} />
                <div className="calendar-grid__body">{renderDays()}</div>
            </div>
        </div>
    );
};

export default Calendar;
