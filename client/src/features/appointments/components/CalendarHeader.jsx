import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './CalendarHeader.css';

/**
 * CalendarHeader (Internal to feature).
 * Small header with month navigation for the Mini-Calendar.
 */
const CalendarHeader = ({ month, year, onPrevMonth, onNextMonth }) => {
  return (
    <div className="calendar-header">
      <Button className="calendar-header__nav-button" onClick={onPrevMonth} aria-label="Previous month" unstyled>
        <Icon name="chevron_left" />
      </Button>
      <h3 className="calendar-header__title">{month} {year}</h3>
      <Button className="calendar-header__nav-button" onClick={onNextMonth} aria-label="Next month" unstyled>
        <Icon name="chevron_right" />
      </Button>
    </div>
  );
};

export default CalendarHeader;
