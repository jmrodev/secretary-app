import React from 'react';
import { StatusDot } from './StatusDot';
import styles from './AppointmentsBadge.module.css';

/**
 * AppointmentsBadge (Atom/Molecule Component)
 * Pill tag containing the status dot and appointment count number.
 */
export const AppointmentsBadge = ({ count }) => {
  return (
    <div className={styles.AppointmentsBadge__badge} title={`${count} turnos`}>
      <StatusDot count={count} />
      <span className={styles.AppointmentsBadge__count}>{count}</span>
    </div>
  );
};

