import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './CalendarDayCell.module.css';

const EMPTY_OBJECT = {};

// Overtime ring colors by appointment count: amber (1), orange (2), vivid red (3+).
// Distinct steps make the escalation clearly readable.
const OVERTIME_AMBER = '#f59e0b';
const OVERTIME_ORANGE = '#f97316';
const OVERTIME_RED = '#ef4444';

/**
 * CalendarDayCell (Internal to feature).
 * Represents a single day in the monthly calendar grid.
 */
export const CalendarDayCell = ({
  day,
  status = EMPTY_OBJECT, // { isCurrentMonth, isSelected, isToday, isHoliday, isPast, disabled, compact }
  holidayDescription = '',
  appointmentCount = 0,
  maxAppointmentCount = 0,
  bookedInCount = 0,
  bookedOutCount = 0,
  freeInCount = 0,
  freeOutCount = 0,
  totalInCount = 0,
  totalOutCount = 0,
  showOutOfHours = false,
  onClick,
  t
}) => {
  const { 
    isSelected = false, 
    isToday = false, 
    isWeekend = false,
    isHoliday = false, 
    isPast = false, 
    disabled = false, 
    compact = false 
  } = status;

  const handleSelectDay = () => { if (!disabled && onClick) onClick(day); };

  // Inner ring: occupancy of the doctor's official capacity (bookedIn / totalIn).
  // When a normal appointment frees up, this ring empties proportionally.
  const capacityTotal = bookedInCount + freeInCount;
  let normalOccupancy;
  if (capacityTotal > 0) {
    normalOccupancy = (bookedInCount / capacityTotal) * 100;
  } else if (maxAppointmentCount > 0 && appointmentCount > 0) {
    // No schedule/capacity info: fall back to relative count across the month.
    normalOccupancy = Math.max(20, (appointmentCount / maxAppointmentCount) * 100);
  } else {
    normalOccupancy = 0;
  }
  // Full day: every official slot is booked. The inner ring switches to a
  // "complete" color so full days are instantly recognizable.
  const isFull = capacityTotal > 0 && bookedInCount >= capacityTotal;

  // Outer ring: overtime appointments. Shown when the doctor accepts overtime
  // (capacityOut > 0) or there are appointments outside official hours.
  // Ring fill follows the doctor's overtime capacity config (bookedOut / totalOut);
  // the color is logarithmic over the NUMBER of overtime appointments so it turns
  // vivid red from 3 overtime appointments on.
  const extraTotal = bookedOutCount + freeOutCount;
  const extraOccupancy = extraTotal > 0 ? (bookedOutCount / extraTotal) * 100 : 0;
  const showExtraRing = extraTotal > 0;
  const overtimeColor = showExtraRing
    ? (bookedOutCount >= 3 ? OVERTIME_RED
      : bookedOutCount === 2 ? OVERTIME_ORANGE
      : OVERTIME_AMBER)
    : OVERTIME_AMBER;

  const cellClasses = [
    styles.CalendarDayCell__root,
    isSelected && styles.CalendarDayCell__selected,
    isToday && styles.CalendarDayCell__today,
    isWeekend && styles.CalendarDayCell__weekend,
    isHoliday && styles.CalendarDayCell__holiday,
    isPast && styles.CalendarDayCell__past,
    isFull && styles.CalendarDayCell__full,
    bookedOutCount > 0 && styles.CalendarDayCell__overtime,
    compact && styles.CalendarDayCell__compact
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick(day);
    }
  };

  const ringStyles = {
    '--occupancy-normal': `${normalOccupancy}%`,
    '--occupancy-extra': `${extraOccupancy}%`,
    '--overtime-color': overtimeColor,
    '--extra-opacity': showExtraRing ? '1' : '0'
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
      <div className={`${styles.CalendarDayCell__content}`}>
        <div className={styles.CalendarDayCell__numberWrapper} style={ringStyles}>
          <span className={`${styles.CalendarDayCell__number}`}>{day}</span>
        </div>
        <div className={styles.CalendarDayCell__markers}>
          {isHoliday && (
            <span className={`${styles.CalendarDayCell__holidayMarker}`} title={holidayDescription}>
              <Icon name="event_busy" size="0.7rem" />
            </span>
          )}
          {isToday && (
            <span className={`${styles.CalendarDayCell__todayMarker}`}>
              {t('today') || 'Hoy'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

