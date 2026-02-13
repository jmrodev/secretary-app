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
  variant = 'normal',
  showOutOfHours = false
}) => {
  if (count === 0 && !isHoliday && !freeInCount && !freeOutCount) {
    return null;
  }

  return (
    <div className="calendar-day-indicator">


      {/* 2x2 Grid: Top row = In-hours, Bottom row = Out-of-hours */}
      <div className="calendar-day-indicator__grid">
        {/* Top Row - In-Hours */}
        <div className="calendar-day-indicator__row calendar-day-indicator__row--in-hours">
          {/* Free In-Hours (Green) - Left */}
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-normal ${freeInCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${freeInCount} Libres (Horario)`}>
            <span className="calendar-day-indicator__count">{freeInCount || 0}</span>
          </div>

          {/* Booked In-Hours (Blue) - Right */}
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-normal ${bookedInCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${bookedInCount} Ocupados (Horario)`}>
            <span className="calendar-day-indicator__count">{bookedInCount || 0}</span>
          </div>
        </div>

        {/* Bottom Row - Out-of-Hours (ALWAYS rendered to prevent layout shift) */}
        <div className={`calendar-day-indicator__row calendar-day-indicator__row--out-hours ${!showOutOfHours ? 'calendar-day-indicator__row--hidden' : ''
          }`}>
          {/* Free Out-of-Hours (Amber) - Left */}
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-extra ${freeOutCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${freeOutCount} Libres (Extra)`}>
            <span className="calendar-day-indicator__count">{freeOutCount || 0}</span>
          </div>

          {/* Booked Out-of-Hours (Indigo) - Right */}
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-extra ${bookedOutCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${bookedOutCount} Ocupados (Extra)`}>
            <span className="calendar-day-indicator__count">{bookedOutCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDayIndicator;