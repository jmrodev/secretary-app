import React from 'react';
import styles from './DayHeaders.module.css';

/**
 * DayHeaders (Internal to feature).
 * Small grid showing day-of-week abbreviations for the Monthly Calendar.
 */
export const DayHeaders = ({ daysOfWeek }) => {
  return (
    <div className={`${styles.DayHeaders__root}`}>
      {daysOfWeek.map((day) => (
        <div key={day} className={`${styles.DayHeaders__day}`}>{day}</div>
      ))}
    </div>
  );
};

