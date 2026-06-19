import React from 'react';
import PropTypes from 'prop-types';
import styles from './HolidayBadge.module.css';

/**
 * HolidayBadge (Atom Component)
 * Simple tag indicating that a specific day is a holiday.
 */
const HolidayBadge = ({ title }) => {
  return (
    <span className={styles.badge} title={title}>
      Feriado
    </span>
  );
};

HolidayBadge.propTypes = {
  title: PropTypes.string
};

HolidayBadge.defaultProps = {
  title: ''
};

export default HolidayBadge;
