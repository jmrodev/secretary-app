import React from 'react';
import './CalendarHeader.css';

/**
 * CalendarHeader (Internal to feature).
 * Small header with month navigation for the Mini-Calendar.
 */
const CalendarHeader = ({ month, year, onPrevMonth, onNextMonth }) => {
  return (
    <div className="calendar-header">
      <button className="calendar-header__nav-button" onClick={onPrevMonth} aria-label="Previous month">⬅️</button>
      <h3 className="calendar-header__title">{month} {year}</h3>
      <button className="calendar-header__nav-button" onClick={onNextMonth} aria-label="Next month">➡️</button>
    </div>
  );
};

export default CalendarHeader;
