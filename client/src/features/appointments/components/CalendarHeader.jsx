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
      <Button 
        variant="ghost" 
        size="sm-compact" 
        onClick={onPrevMonth} 
        aria-label="Previous month"
        className="calendar-header__nav-button"
        icon={<Icon name="chevron_left" />}
      />
      
      <h3 className="calendar-header__title">{month} {year}</h3>
      
      <Button 
        variant="ghost" 
        size="sm-compact" 
        onClick={onNextMonth} 
        aria-label="Next month"
        className="calendar-header__nav-button"
        icon={<Icon name="chevron_right" />}
      />
    </div>
  );
};

export default CalendarHeader;
