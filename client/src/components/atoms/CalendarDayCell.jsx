import React from 'react';
import CalendarDayIndicator from './CalendarDayIndicator';
import './CalendarDayCell.css';

const CalendarDayCell = ({
  day,
  isCurrentMonth = true,
  isSelected = false,
  isToday = false,
  isHoliday = false,
  holidayDescription = '',
  appointmentCount = 0,
  bookedInCount = 0,
  bookedOutCount = 0,
  freeInCount = 0,
  freeOutCount = 0,
  showOutOfHours = false,
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(day);
    }
  };

  const cellClasses = [
    'calendar-day-cell',
    'calendar-day-cell--interactive',
    !isCurrentMonth && 'calendar-day-cell--other-month',
    isSelected && 'calendar-day-cell--selected',
    isToday && 'calendar-day-cell--today',
    isHoliday && 'calendar-day-cell--holiday',
    disabled && 'calendar-day-cell--disabled'
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cellClasses}
      onClick={handleClick}
      title={isHoliday ? holidayDescription : ''}
    >
      <div className="calendar-day-cell__content">
        <div className="calendar-day-cell__date">
          <span className="calendar-day-cell__number">{day}</span>
          {isToday && <span className="calendar-day-cell__today-marker">HOY</span>}
        </div>

        <CalendarDayIndicator
          count={appointmentCount}
          bookedInCount={bookedInCount}
          bookedOutCount={bookedOutCount}
          freeInCount={freeInCount}
          freeOutCount={freeOutCount}
          isHoliday={isHoliday}
          holidayDescription={holidayDescription}
          variant={appointmentCount > 5 ? 'high' : 'normal'}
          showOutOfHours={showOutOfHours}
        />
      </div>
    </div>
  );
};

export default CalendarDayCell;