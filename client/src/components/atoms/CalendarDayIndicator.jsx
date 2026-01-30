import React from 'react';
import './CalendarDayIndicator.css';

const CalendarDayIndicator = ({
  count,
  bookedInCount,
  bookedOutCount,
  freeInCount,
  freeOutCount,
  isHoliday,
  holidayDescription = '',
  variant = 'normal'
}) => {
  if (count === 0 && !isHoliday && !freeInCount && !freeOutCount) {
    return null;
  }

  return (
    <div className="calendar-day-indicator">
      {isHoliday && (
        <div className="calendar-day-indicator__holiday-badge" title={holidayDescription}>
          <span className="calendar-day-indicator__count">H</span>
        </div>
      )}

      {/* 1. Free In-Hours (Green) */}
      {freeInCount !== undefined && freeInCount > 0 && (
        <div className="calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-normal"
          title={`${freeInCount} Libres (Horario)`}>
          <span className="calendar-day-indicator__count">{freeInCount}</span>
        </div>
      )}

      {/* 2. Free Out-of-Hours (Yellow) */}
      {freeOutCount !== undefined && freeOutCount > 0 && (
        <div className="calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-extra"
          title={`${freeOutCount} Libres (Extra)`}>
          <span className="calendar-day-indicator__count">{freeOutCount}</span>
        </div>
      )}

      {/* 3. Occupied In-Hours (Blue) */}
      {bookedInCount > 0 && (
        <div className="calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-normal"
          title={`${bookedInCount} Ocupados (Horario)`}>
          <span className="calendar-day-indicator__count">{bookedInCount}</span>
        </div>
      )}

      {/* 4. Occupied Out-of-Hours (Indigo/Extra) */}
      {bookedOutCount > 0 && (
        <div className="calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-extra"
          title={`${bookedOutCount} Ocupados (Extra)`}>
          <span className="calendar-day-indicator__count">{bookedOutCount}</span>
        </div>
      )}
    </div>
  );
};

export default CalendarDayIndicator;