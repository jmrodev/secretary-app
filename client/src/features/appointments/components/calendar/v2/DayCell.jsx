import React from 'react';
import PropTypes from 'prop-types';
import styles from './DayCell.module.css';

/**
 * DayCell (Atomic Component)
 * Represents a single day in the calendar grid.
 */
const DayCell = ({
  day,
  isSelected,
  isToday,
  isCurrentMonth,
  isHoliday,
  holidayName,
  isPast,
  appointmentsCount,
  onClick,
  className
}) => {
  // If no day is provided, render an empty/inactive cell placeholder to maintain the grid
  if (!day) {
    return <div className={`${styles.placeholder} ${className || ''}`} />;
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
    styles.dayCell,
    isSelected && styles.selected,
    isToday && styles.today,
    isHoliday && styles.holiday,
    isPast && styles.past,
    !isCurrentMonth && styles.outsideMonth,
    className
  ].filter(Boolean).join(' ');

  // Determine appointments status indicator class
  const getIndicatorClass = () => {
    if (appointmentsCount > 5) return styles.indicatorHigh;
    if (appointmentsCount > 2) return styles.indicatorMedium;
    if (appointmentsCount > 0) return styles.indicatorLow;
    return '';
  };

  return (
    <div
      className={cellClasses}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Día ${day}${isToday ? ', Hoy' : ''}${isHoliday ? `, Feriado: ${holidayName}` : ''}${appointmentsCount ? `, ${appointmentsCount} turnos` : ''}`}
      title={isHoliday ? holidayName : undefined}
    >
      <div className={styles.header}>
        <span className={styles.number}>{day}</span>
        {isToday && <span className={styles.todayIndicator} aria-hidden="true" />}
      </div>

      <div className={styles.content}>
        {isHoliday && (
          <span className={styles.holidayBadge} title={holidayName}>
            Feriado
          </span>
        )}
      </div>

      <div className={styles.footer}>
        {appointmentsCount > 0 && (
          <div className={styles.appointmentsBadge} title={`${appointmentsCount} turnos`}>
            <span className={`${styles.statusDot} ${getIndicatorClass()}`} />
            <span className={styles.countText}>{appointmentsCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

DayCell.propTypes = {
  day: PropTypes.number,
  isSelected: PropTypes.bool,
  isToday: PropTypes.bool,
  isCurrentMonth: PropTypes.bool,
  isHoliday: PropTypes.bool,
  holidayName: PropTypes.string,
  isPast: PropTypes.bool,
  appointmentsCount: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string
};

DayCell.defaultProps = {
  isSelected: false,
  isToday: false,
  isCurrentMonth: true,
  isHoliday: false,
  holidayName: '',
  isPast: false,
  appointmentsCount: 0,
  className: ''
};

export default DayCell;
