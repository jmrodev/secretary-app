import React from 'react';
import CalendarDayCell from './CalendarDayCell.jsx';
import { isPastDay, isSameDay, getNow, parseDate, createDate, formatKeyDate } from '@/utils/core/dateUtils';
import styles from './Calendar.module.css';

/**
 * CalendarGrid (Executor Component).
 * Renders the actual days of the month.
 */
const CalendarGrid = ({ 
    viewDate, selectedDate, days, firstDay, calendarStats, 
    appointmentsByDate, holidaysByDate, showOutOfHours, compact, onDateSelect, t 
}) => {
    const dayElements = [];
    
    // Empty cells before first day
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    for (let cellIdx = 0; cellIdx < firstDay; cellIdx++) {
        dayElements.push(<div key={`pre-pad-${year}-${month}-${cellIdx}`} className={`${styles.cellEmpty}`}></div>);
    }

    // Days of the month
    for (let dayNum = 1; dayNum <= days; dayNum++) {
        const currentDay = createDate(year, month, dayNum);
        const isSelected = selectedDate && isSameDay(parseDate(selectedDate), currentDay);
        const isTodayDate = isSameDay(getNow(), currentDay);
        const dateStr = formatKeyDate(currentDay);
        
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
                onSelect={() => onDateSelect(currentDay)}
            />
        );
    }

    return <>{dayElements}</>;
};

export default CalendarGrid;
