import React, { useState, useRef } from 'react';
import CalendarDayCell from './CalendarDayCell.jsx';
import CalendarHeader from './CalendarHeader.jsx';
import DayHeaders from '../schedule/DayHeaders.jsx';
import { useLanguage } from '@/hooks/useLanguage';
import { isPastDay, isSameDay, getNow, parseDate, createDate, getDaysInMonth } from '@/utils/core/dateUtils';
import './Calendar.css';

/**
 * Calendar (Executor Component).
 * Renders the monthly navigation grid for the agenda.
 */
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * Calendar (Executor Component).
 * Renders the monthly navigation grid for the agenda.
 */
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
    const [viewDate, setViewDate] = useState(() => parseDate(selectedDate || getNow()));
    const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);
    const { t } = useLanguage();

    // React 19 best practice: Sync state from props during render using state, not refs
    const parsedSelected = parseDate(selectedDate || getNow());
    if (selectedDate !== prevSelectedDate) {
        setPrevSelectedDate(selectedDate);
        if (!isSameDay(viewDate, parsedSelected)) {
            setViewDate(parsedSelected);
        }
    }


    const days = getDaysInMonth(viewDate);
    const firstDay = createDate(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const months = t('months_array') || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = t('days_short_array') || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const appointmentsByDate = React.useMemo(() => {
        const map = {};
        appointments.forEach(appt => {
            const d = parseDate(appt.appointment_date);
            const dateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(appt);
        });
        return map;
    }, [appointments]);

    const holidaysByDate = React.useMemo(() => {
        const map = {};
        holidays.forEach(h => {
            if (!h.date) return;
            const d = parseDate(h.date);
            const dateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            map[dateStr] = h;
        });
        return map;
    }, [holidays]);

    const handlePrevMonth = () => {
        const newDate = createDate(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
    };

    const handleNextMonth = () => {
        const newDate = createDate(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
    };

    return (
        <div className="calendar">
            {!hideNavigation && (
                <CalendarHeader
                    month={months[viewDate.getMonth()]} year={viewDate.getFullYear()}
                    onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
                />
            )}
            {hideNavigation && (
                <div className="calendar__simple-title">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
            )}
            <div className="calendar__main-container">
                <DayHeaders daysOfWeek={daysOfWeek} />
                <div className="calendar__body">
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

const CalendarGrid = ({ 
    viewDate, selectedDate, days, firstDay, calendarStats, 
    appointmentsByDate, holidaysByDate, showOutOfHours, compact, onDateSelect, t 
}) => {
    const dayElements = [];
    
    // Empty cells before first day
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    for (let cellIdx = 0; cellIdx < firstDay; cellIdx++) {
        dayElements.push(<div key={`pre-pad-${year}-${month}-${cellIdx}`} className="calendar__cell calendar__cell--empty"></div>);
    }

    // Days of the month
    for (let dayNum = 1; dayNum <= days; dayNum++) {
        const currentDay = createDate(year, month, dayNum);
        const isSelected = selectedDate && isSameDay(parseDate(selectedDate), currentDay);
        const isTodayDate = isSameDay(getNow(), currentDay);
        const dateStr = [currentDay.getFullYear(), String(currentDay.getMonth() + 1).padStart(2, '0'), String(currentDay.getDate()).padStart(2, '0')].join('-');
        const dayStats = calendarStats[dateStr] || {};
        
        const dayAppts = appointmentsByDate[dateStr] || [];
        
        const bookedInCount = (dayStats.bookedIn !== undefined) ? dayStats.bookedIn : dayAppts.filter(a => !a.is_out_of_hours).length;
        const bookedOutCount = (dayStats.bookedOut !== undefined) ? dayStats.bookedOut : dayAppts.filter(a => a.is_out_of_hours).length;
        const count = (dayStats.bookedIn !== undefined && dayStats.bookedOut !== undefined) ? (dayStats.bookedIn + dayStats.bookedOut) : dayAppts.length;
        const isHolidayObj = holidaysByDate[dateStr];

        dayElements.push(
            <CalendarDayCell
                key={dateStr} 
                day={dayNum} 
                status={{
                    isSelected,
                    isToday: isTodayDate,
                    isPast: isPastDay(currentDay),
                    isHoliday: !!isHolidayObj,
                    compact
                }}
                holidayDescription={isHolidayObj?.description || ''}
                appointmentCount={count} 
                bookedInCount={bookedInCount} 
                bookedOutCount={bookedOutCount}
                freeInCount={dayStats.freeIn} 
                freeOutCount={dayStats.freeOut} 
                showOutOfHours={showOutOfHours}
                onClick={() => onDateSelect(currentDay)} 
                t={t} 
            />
        );
    }

    // Fill to 6 rows (42 cells)
    const totalCells = 42;
    const currentCount = dayElements.length;
    for (let postIdx = 0; postIdx < (totalCells - currentCount); postIdx++) {
        dayElements.push(<div key={`post-pad-${year}-${month}-${postIdx}`} className="calendar__cell calendar__cell--empty"></div>);
    }

    return <>{dayElements}</>;
};

export default Calendar;
