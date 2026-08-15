import React from 'react';
import styles from './StatusDot.module.css';

/**
 * StatusDot (Atom Component)
 * A small status indicator dot whose color changes based on load value.
 */
export const StatusDot = ({ count = 0 }) => {
  const getDensityClass = () => {
    if (count > 5) return styles.high;
    if (count > 2) return styles.medium;
    if (count > 0) return styles.low;
    return '';
  };

  return <span className={`${styles.dot} ${getDensityClass()}`} aria-hidden="true" />;
};

