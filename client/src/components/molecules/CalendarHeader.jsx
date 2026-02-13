import React from 'react';
import './CalendarHeader.css';

const CalendarHeader = ({ month, year, onPrevMonth, onNextMonth }) => {
  return (
    <div className="calendar-header">
      <button
        className="calendar-header__nav-button calendar-header__nav-button--prev"
        onClick={onPrevMonth}
        aria-label="Previous month"
      >
        ⬅️
      </button>

      <h3 className="calendar-header__title">
        {month} {year}
      </h3>

      <button
        className="calendar-header__nav-button calendar-header__nav-button--next"
        onClick={onNextMonth}
        aria-label="Next month"
      >
        ➡️
      </button>
    </div>
  );
};

export default CalendarHeader;