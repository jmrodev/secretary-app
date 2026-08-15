import React from 'react';
import { DayNumber } from './atoms/DayNumber';
import { HolidayBadge } from './atoms/HolidayBadge';
import { AppointmentsBadge } from './atoms/AppointmentsBadge';
import styles from './DayCell.module.css';

/**
 * DayCell (Molecule Component)
 * Represents a single day in the calendar grid, composed of atomic elements.
 */
export const DayCell = ({
  day,
  isSelected = false,
  isToday = false,
  isCurrentMonth = true,
  isHoliday = false,
  holidayName = '',
  isPast = false,
  appointmentsCount = 0,
  onClick,
  className = ''
}) => {
  // Render placeholder for dates not falling in the current month bounds
  if (!day) {
    return <div className={`${styles.DayCell__placeholder} ${className}`} />;
  }

  const handleSelect = () => {
    if (onClick) onClick(day);
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(day);
    }
  };

  const cellClasses = [
    styles.DayCell__dayCell,
    isSelected && styles.DayCell__selected,
    isToday && styles.DayCell__today,
    isHoliday && styles.DayCell__holiday,
    isPast && styles.DayCell__past,
    !isCurrentMonth && styles.DayCell__outsideMonth,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cellClasses}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Día ${day}${isToday ? ', Hoy' : ''}${isHoliday ? `, Feriado: ${holidayName}` : ''}${appointmentsCount ? `, ${appointmentsCount} turnos` : ''}`}
    >
      <div className={styles.DayCell__header}>
        <DayNumber day={day} isToday={isToday} />
      </div>

      <div className={styles.DayCell__content}>
        {isHoliday && <HolidayBadge title={holidayName} />}
      </div>

      <div className={styles.DayCell__footer}>
        {appointmentsCount > 0 && (
          <AppointmentsBadge count={appointmentsCount} />
        )}
      </div>
    </div>
  );
};

