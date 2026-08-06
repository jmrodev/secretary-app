import React from 'react';
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
  appointmentCount: _appointmentCount = 0,
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
    isWeekend = false,
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
    isWeekend && styles.weekend,
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

  const EXTRA_RADIUS = 44;
  const extraCirc = 2 * Math.PI * EXTRA_RADIUS;
  const extraOccupiedLen = extraCirc * (extraOccupancy / 100);
  const dashLen = 6;
  const gapLen = 5;
  const dashCount = extraOccupiedLen > 0 ? Math.max(1, Math.floor(extraOccupiedLen / (dashLen + gapLen))) : 0;
  const extraDashPattern = dashCount > 0
    ? `${dashLen} ${gapLen} `.repeat(dashCount) + `${Math.max(0, extraOccupiedLen - dashCount * (dashLen + gapLen))} ${extraCirc - extraOccupiedLen}`
    : `0 ${extraCirc}`;

  const ringStyles = {
    '--occupancy-normal': `${normalOccupancy}%`,
    '--extra-opacity': (showOutOfHours && extraTotal > 0) ? '1' : '0'
  };

  const showExtraRing = showOutOfHours && extraTotal > 0;

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
          {showExtraRing && (
            <svg className={styles.extraRing} viewBox="0 0 100 100" aria-hidden="true">
              <circle
                className={styles.extraRingTrack}
                cx="50" cy="50" r={EXTRA_RADIUS}
              />
              <circle
                className={styles.extraRingFill}
                cx="50" cy="50" r={EXTRA_RADIUS}
                strokeDasharray={extraDashPattern}
                transform="rotate(-90 50 50)"
              />
            </svg>
          )}
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

