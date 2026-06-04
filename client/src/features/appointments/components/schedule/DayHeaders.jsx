import React from 'react';
import styles from './DayHeaders.module.css';

/**
 * DayHeaders (Internal to feature).
 * Small grid showing day-of-week abbreviations for the Monthly Calendar.
 */
const DayHeaders = ({ daysOfWeek }) => {
  return (
    <div className={`${styles.root}`}>
      {daysOfWeek.map((day) => (
        <div key={day} className={`${styles.day}`}>{day}</div>
      ))}
    </div>
  );
};

export default DayHeaders;
