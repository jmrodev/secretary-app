import React from 'react';
import CalendarDayIndicator from './CalendarDayIndicator';
import './CalendarDayCell.css';

const EMPTY_OBJECT = {};

/**
 * CalendarDayCell (Internal to feature).
 * Represents a single day in the monthly calendar grid.
 */
const CalendarDayCell = ({
  day,
  status = EMPTY_OBJECT, // { isCurrentMonth, isSelected, isToday, isHoliday, isPast, disabled, compact }
  holidayDescription = '',
  appointmentCount = 0,
  bookedInCount = 0,
  bookedOutCount = 0,
  freeInCount = 0,
  freeOutCount = 0,
  showOutOfHours = false,
  onClick,
  t
}) => {
  const { 
    isSelected = false, 
    isToday = false, 
    isHoliday = false, 
    isPast = false, 
    disabled = false, 
    compact = false 
  } = status;

  const handleSelectDay = () => { if (!disabled && onClick) onClick(day); };

  const cellClasses = [
    'calendar-day-cell',
    isSelected && 'calendar-day-cell--selected',
    isToday && 'calendar-day-cell--today',
    isHoliday && 'calendar-day-cell--holiday',
    isPast && 'calendar-day-cell--past',
    compact && 'calendar-day-cell--compact'
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick(day);
    }
  };

  return (
    <div
      className={cellClasses}
      onClick={handleSelectDay}
      onKeyDown={handleKeyDown}
      title={isHoliday ? holidayDescription : ''}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${t('day')} ${day}${isHoliday ? `, ${holidayDescription}` : ''}`}
    >
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
          showOutOfHours={showOutOfHours} t={t} isSelected={isSelected}
        />
      </div>
    </div>
  );
};

export default CalendarDayCell;
