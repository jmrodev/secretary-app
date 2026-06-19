import React from 'react';
import PropTypes from 'prop-types';
import StatusDot from './StatusDot';
import styles from './AppointmentsBadge.module.css';

/**
 * AppointmentsBadge (Atom/Molecule Component)
 * Pill tag containing the status dot and appointment count number.
 */
const AppointmentsBadge = ({ count }) => {
  return (
    <div className={styles.badge} title={`${count} turnos`}>
      <StatusDot count={count} />
      <span className={styles.count}>{count}</span>
    </div>
  );
};

AppointmentsBadge.propTypes = {
  count: PropTypes.number.isRequired
};

export default AppointmentsBadge;
