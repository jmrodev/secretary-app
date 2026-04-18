import React from 'react';
import CalendarDayIndicator from '@/features/appointments/components/CalendarDayIndicator';
import './CalendarDayCell.css';

/**
 * CalendarDayCell (Internal to feature).
 * Represents a single day in the monthly calendar grid.
 */
const CalendarDayCell = ({
  day, isCurrentMonth = true, isSelected = false, isToday = false, isHoliday = false, holidayDescription = '',
  appointmentCount = 0, bookedInCount = 0, bookedOutCount = 0, freeInCount = 0, freeOutCount = 0,
  showOutOfHours = false, onClick, disabled = false, isPast = false, t
}) => {
  const handleClick = () => { if (!disabled && onClick) onClick(day); };

  const cellClasses = [
    'calendar-day-cell',
    isSelected && 'calendar-day-cell--selected',
    isToday && 'calendar-day-cell--today',
    isHoliday && 'calendar-day-cell--holiday',
    isPast && 'calendar-day-cell--past'
  ].filter(Boolean).join(' ');

  return (
    <div className={cellClasses} onClick={handleClick} title={isHoliday ? holidayDescription : ''}>
      <div className="calendar-day-cell__content">
        <div className="calendar-day-cell__date">
          <span className="calendar-day-cell__number">{day}</span>
          <div className="calendar-day-cell__markers">
            {isHoliday && <span className="calendar-day-cell__holiday-marker" title={holidayDescription}>H</span>}
            {isToday && <span className="calendar-day-cell__today-marker">HOY</span>}
          </div>
        </div>

        <CalendarDayIndicator
          count={appointmentCount} bookedInCount={bookedInCount} bookedOutCount={bookedOutCount}
          freeInCount={freeInCount} freeOutCount={freeOutCount} isHoliday={isHoliday}
          holidayDescription={holidayDescription} variant={appointmentCount > 5 ? 'high' : 'normal'}
          showOutOfHours={showOutOfHours} t={t}
        />
      </div>
    </div>
  );
};

export default CalendarDayCell;
