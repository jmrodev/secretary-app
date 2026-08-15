import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './CalendarHeader.module.css';

/**
 * CalendarHeader (Internal to feature).
 * Small header with month navigation for the Mini-Calendar.
 */
export const CalendarHeader = ({ month, year, onPrevMonth, onNextMonth }) => {
  return (
    <div className={`${styles.CalendarHeader__root}`}>
      <Button className={`${styles.CalendarHeader__navButton}`} onClick={onPrevMonth} aria-label="Previous month" unstyled>
        <Icon name="chevron_left" />
      </Button>
      <h3 className={`${styles.CalendarHeader__title}`}>{month} {year}</h3>
      <Button className={`${styles.CalendarHeader__navButton}`} onClick={onNextMonth} aria-label="Next month" unstyled>
        <Icon name="chevron_right" />
      </Button>
    </div>
  );
};

