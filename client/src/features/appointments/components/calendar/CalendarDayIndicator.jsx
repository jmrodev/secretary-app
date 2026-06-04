import React from 'react';
import styles from './CalendarDayIndicator.module.css';

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
    <div className={`${styles.root} ${isSelected ? styles.selected : ''}`}>
      <div className={`${styles.grid}`}>
        <div className={`${styles.row}`}>
          <div className={`${styles.appointmentBadge} ${styles.appointmentBadgeFreeNormal} ${freeInCount === 0 ? styles.appointmentBadgeZero : ''}`}
            title={`${freeInCount} ${translate('free_slots_label', 'Libres')} (${translate('regular_schedule', 'Horario')})`}>
            <span>{freeInCount || 0}</span>
          </div>
          <div className={`${styles.appointmentBadge} ${styles.appointmentBadgeBookedNormal} ${bookedInCount === 0 ? styles.appointmentBadgeZero : ''}`}
            title={`${bookedInCount} ${translate('booked_slots_label', 'Ocupados')} (${translate('regular_schedule', 'Horario')})`}>
            <span>{bookedInCount || 0}</span>
          </div>
        </div>

        <div className={`${styles.row} ${!showOutOfHours ? styles.rowHidden : ''}`}>
          <div className={`${styles.appointmentBadge} ${styles.appointmentBadgeFreeExtra} ${freeOutCount === 0 ? styles.appointmentBadgeZero : ''}`}
            title={`${freeOutCount} ${translate('free_slots_label', 'Libres')} (${translate('extra_schedule', 'Extra')})`}>
            <span>{freeOutCount || 0}</span>
          </div>
          <div className={`${styles.appointmentBadge} ${styles.appointmentBadgeBookedExtra} ${bookedOutCount === 0 ? styles.appointmentBadgeZero : ''}`}
            title={`${bookedOutCount} ${translate('booked_slots_label', 'Ocupados')} (${translate('extra_schedule', 'Extra')})`}>
            <span>{bookedOutCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDayIndicator;
