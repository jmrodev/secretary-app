import React from 'react';
import CalendarDayIndicator from './CalendarDayIndicator';
import Icon from '@/components/atoms/Icon';
import styles from './CalendarDayCell.module.css';

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
    styles.root,
    isSelected && styles.selected,
    isToday && styles.today,
    isHoliday && styles.holiday,
    isPast && styles.past,
    compact && styles.compact
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick(day);
    }
  };

  const normalTotal = bookedInCount + freeInCount;
  const normalOccupancy = normalTotal > 0 ? (bookedInCount / normalTotal) * 100 : 0;
  
  const extraTotal = bookedOutCount + freeOutCount;
  const extraOccupancy = extraTotal > 0 ? (bookedOutCount / extraTotal) * 100 : 0;

  const ringStyles = {
    '--occupancy-normal': `${normalOccupancy}%`,
    '--occupancy-extra': `${extraOccupancy}%`,
    '--extra-opacity': (showOutOfHours && extraTotal > 0) ? '1' : '0'
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
      <div className={`${styles.content}`}>
        <div className={styles.numberWrapper} style={ringStyles}>
          <span className={`${styles.number}`}>{day}</span>
        </div>
        <div className={styles.markers}>
          {isHoliday && (
            <span className={`${styles.holidayMarker}`} title={holidayDescription}>
              <Icon name="event_busy" size="0.7rem" />
            </span>
          )}
          {isToday && (
            <span className={`${styles.todayMarker}`}>
              {t('today') || 'Hoy'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarDayCell;

