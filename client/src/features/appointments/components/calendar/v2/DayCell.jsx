import React from 'react';
import PropTypes from 'prop-types';
import DayNumber from './atoms/DayNumber';
import HolidayBadge from './atoms/HolidayBadge';
import AppointmentsBadge from './atoms/AppointmentsBadge';
import styles from './DayCell.module.css';

/**
 * DayCell (Molecule Component)
 * Represents a single day in the calendar grid, composed of atomic elements.
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
  // Render placeholder for dates not falling in the current month bounds
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

  return (
    <div
      className={cellClasses}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Día ${day}${isToday ? ', Hoy' : ''}${isHoliday ? `, Feriado: ${holidayName}` : ''}${appointmentsCount ? `, ${appointmentsCount} turnos` : ''}`}
    >
      <div className={styles.header}>
        <DayNumber day={day} isToday={isToday} />
      </div>

      <div className={styles.content}>
        {isHoliday && <HolidayBadge title={holidayName} />}
      </div>

      <div className={styles.footer}>
        {appointmentsCount > 0 && (
          <AppointmentsBadge count={appointmentsCount} />
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
