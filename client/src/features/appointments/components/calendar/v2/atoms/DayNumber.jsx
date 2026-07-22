import React from 'react';
import styles from './DayNumber.module.css';

/**
 * DayNumber (Atom Component)
 * Displays the numeric day and visual indicator if it is today.
 */
const DayNumber = ({ day, isToday = false }) => {
  return (
    <div className={styles.root}>
      <span className={`${styles.number} ${isToday ? styles.todayNumber : ''}`}>
        {day}
      </span>
      {isToday && (
        <span
          className={styles.todayIndicator}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default DayNumber;
