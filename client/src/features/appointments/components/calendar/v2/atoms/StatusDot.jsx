import React from 'react';
import PropTypes from 'prop-types';
import styles from './StatusDot.module.css';

/**
 * StatusDot (Atom Component)
 * A small status indicator dot whose color changes based on load value.
 */
const StatusDot = ({ count }) => {
  const getDensityClass = () => {
    if (count > 5) return styles.high;
    if (count > 2) return styles.medium;
    if (count > 0) return styles.low;
    return '';
  };

  return <span className={`${styles.dot} ${getDensityClass()}`} aria-hidden="true" />;
};

StatusDot.propTypes = {
  count: PropTypes.number
};

StatusDot.defaultProps = {
  count: 0
};

export default StatusDot;
