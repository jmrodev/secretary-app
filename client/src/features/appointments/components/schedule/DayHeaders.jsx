import React from 'react';
import './DayHeaders.css';

/**
 * DayHeaders (Internal to feature).
 * Small grid showing day-of-week abbreviations for the Monthly Calendar.
 */
const DayHeaders = ({ daysOfWeek }) => {
  return (
    <div className="day-headers">
      {daysOfWeek.map((day) => (
        <div key={day} className="day-headers__day">{day}</div>
      ))}
    </div>
  );
};

export default DayHeaders;
