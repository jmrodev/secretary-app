import React from 'react';
import { CalendarDayCell } from './CalendarDayCell.jsx';
import { isPastDay, isSameDay, getNow, parseDate, createDate, formatKeyDate } from '@/utils/core/dateUtils';
import styles from './Calendar.module.css';

/**
 * CalendarGrid (Executor Component).
 * Renders the actual days of the month.
 */
export const CalendarGrid = ({ 
    viewDate, selectedDate, days, firstDay, calendarStats, 
    appointmentsByDate, holidaysByDate, showOutOfHours, compact, onDateSelect, t 
}) => {
    const dayElements = [];
    
    // Empty cells before first day
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Occupancy is derived from the real appointments visible in the calendar:
    // the busiest day of the month sets the full ring (100%), other days scale
    // by their appointment count. No dependency on backend stats/capacity.
    const maxAppointmentCount = Object.keys(appointmentsByDate).reduce(
        (max, dateStr) => Math.max(max, (appointmentsByDate[dateStr] || []).length),
        0
    );

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
        const freeInCount = (dayStats.freeIn !== undefined) ? dayStats.freeIn : 0;
        const freeOutCount = (dayStats.freeOut !== undefined) ? dayStats.freeOut : 0;
        // Official capacity (normal hours) and overtime capacity (doctor's configured
        // overturn window) come from the backend schedule stats.
        const totalInCount = (dayStats.totalIn !== undefined) ? dayStats.totalIn : 0;
        const totalOutCount = (dayStats.totalOut !== undefined) ? dayStats.totalOut : 0;
        // Count always reflects the real appointments visible in the calendar so the
        // ring occupancy and the month maximum stay consistent.
        const count = dayAppts.length;
        const isHolidayObj = holidaysByDate[dateStr];

        dayElements.push(
            <CalendarDayCell
                key={dateStr} 
                day={dayNum} 
                status={{
                    isSelected,
                    isToday: isTodayDate,
                    isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6,
                    isPast: isPastDay(currentDay),
                    isHoliday: !!isHolidayObj,
                    compact
                }}
                holidayDescription={isHolidayObj?.description || ''}
                appointmentCount={count} 
                maxAppointmentCount={maxAppointmentCount}
                bookedInCount={bookedInCount} 
                bookedOutCount={bookedOutCount}
                freeInCount={freeInCount}
                freeOutCount={freeOutCount}
                totalInCount={totalInCount}
                totalOutCount={totalOutCount}
                showOutOfHours={showOutOfHours}
                onClick={() => onDateSelect(currentDay)}
                t={t}
            />
        );
    }

    return <>{dayElements}</>;
};

