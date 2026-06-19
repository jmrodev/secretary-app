import React from 'react';
import PropTypes from 'prop-types';
import styles from './DayNumber.module.css';

/**
 * DayNumber (Atom Component)
 * Displays the numeric day and visual indicator if it is today.
 */
const DayNumber = ({ day, isToday }) => {
  return (
    <div className={styles.wrapper}>
      <span className={`${styles.number} ${isToday ? styles.today : ''}`}>
        {day}
      </span>
      {isToday && <span className={styles.indicator} aria-hidden="true" />}
    </div>
  );
};

DayNumber.propTypes = {
  day: PropTypes.number.isRequired,
  isToday: PropTypes.bool
};

DayNumber.defaultProps = {
  isToday: false
};

export default DayNumber;
