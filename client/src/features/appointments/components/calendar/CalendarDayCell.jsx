import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './CalendarDayCell.module.css';

const EMPTY_OBJECT = {};

/**
 * CalendarDayCell (Internal to feature).
 * Represents a single day in the monthly calendar grid.
 */
export const CalendarDayCell = ({
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
    styles.CalendarDayCell__root,
    isSelected && styles.CalendarDayCell__selected,
    isToday && styles.CalendarDayCell__today,
    isWeekend && styles.CalendarDayCell__weekend,
    isHoliday && styles.CalendarDayCell__holiday,
    isPast && styles.CalendarDayCell__past,
    compact && styles.CalendarDayCell__compact
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
      <div className={`${styles.CalendarDayCell__content}`}>
        <div className={styles.CalendarDayCell__numberWrapper} style={ringStyles}>
          {showExtraRing && (
            <svg className={styles.CalendarDayCell__extraRing} viewBox="0 0 100 100" aria-hidden="true">
              <circle
                className={styles.CalendarDayCell__extraRingTrack}
                cx="50" cy="50" r={EXTRA_RADIUS}
              />
              <circle
                className={styles.CalendarDayCell__extraRingFill}
                cx="50" cy="50" r={EXTRA_RADIUS}
                strokeDasharray={extraDashPattern}
                transform="rotate(-90 50 50)"
              />
            </svg>
          )}
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

