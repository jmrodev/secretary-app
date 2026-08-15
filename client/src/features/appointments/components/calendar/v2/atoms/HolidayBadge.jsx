import React from 'react';
import styles from './HolidayBadge.module.css';

/**
 * HolidayBadge (Atom Component)
 * Simple tag indicating that a specific day is a holiday.
 */
export const HolidayBadge = ({ title = '' }) => {
  return (
    <span className={styles.badge} title={title}>
      Feriado
    </span>
  );
};

