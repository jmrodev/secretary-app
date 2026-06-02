import React from 'react';
import './CalendarDayIndicator.css';

/**
 * CalendarDayIndicator (Internal to feature).
 * Small grid showing free/booked slots (in-hours and extras) in a calendar day.
 */
const CalendarDayIndicator = ({
  count, bookedInCount, bookedOutCount, freeInCount, freeOutCount, isHoliday,
  showOutOfHours = false, isSelected = false, t
}) => {
  if (count === 0 && !isHoliday && !freeInCount && !freeOutCount) return null;
  const translate = (key, fallback) => (t && t(key)) || fallback;

  return (
    <div className={`calendar-day-indicator ${isSelected ? 'calendar-day-indicator--selected' : ''}`}>
      <div className="calendar-day-indicator__grid">
        <div className="calendar-day-indicator__row calendar-day-indicator__row--in-hours">
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-normal ${freeInCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${freeInCount} ${translate('free_slots_label', 'Libres')} (${translate('regular_schedule', 'Horario')})`}>
            <span className="calendar-day-indicator__count">{freeInCount || 0}</span>
          </div>
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-normal ${bookedInCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${bookedInCount} ${translate('booked_slots_label', 'Ocupados')} (${translate('regular_schedule', 'Horario')})`}>
            <span className="calendar-day-indicator__count">{bookedInCount || 0}</span>
          </div>
        </div>

        <div className={`calendar-day-indicator__row calendar-day-indicator__row--out-hours ${!showOutOfHours ? 'calendar-day-indicator__row--hidden' : ''}`}>
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--free-extra ${freeOutCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${freeOutCount} ${translate('free_slots_label', 'Libres')} (${translate('extra_schedule', 'Extra')})`}>
            <span className="calendar-day-indicator__count">{freeOutCount || 0}</span>
          </div>
          <div className={`calendar-day-indicator__appointment-badge calendar-day-indicator__appointment-badge--booked-extra ${bookedOutCount === 0 ? 'calendar-day-indicator__appointment-badge--zero' : ''}`}
            title={`${bookedOutCount} ${translate('booked_slots_label', 'Ocupados')} (${translate('extra_schedule', 'Extra')})`}>
            <span className="calendar-day-indicator__count">{bookedOutCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDayIndicator;
