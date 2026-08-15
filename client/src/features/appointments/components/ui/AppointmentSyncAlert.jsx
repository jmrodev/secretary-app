import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './AppointmentSyncAlert.module.css';

/**
 * AppointmentSyncAlert Molecule (Internal to feature).
 * Displays info when an appointment is being synced from Google Calendar.
 */
export const AppointmentSyncAlert = ({ info }) => {
    if (!info) return null;
    return (
        <div className={`${styles.root}`}>
            <Icon name="auto_awesome" size="1.2rem" className={`${styles.icon}`} />
            <div className={`${styles.content}`}>
                <span className={`${styles.title}`}>Ajuste de Calendario Google</span>
                <p className={`${styles.text}`}>Completando turno para: <em>{info}</em></p>
            </div>
        </div>
    );
};

