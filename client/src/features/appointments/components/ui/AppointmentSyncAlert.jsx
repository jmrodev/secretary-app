import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './AppointmentSyncAlert.module.css';

/**
 * AppointmentSyncAlert Molecule (Internal to feature).
 * Displays info when an appointment is being synced from Google Calendar.
 */
export const AppointmentSyncAlert = ({ info }) => {
    const { t } = useLanguage();
    if (!info) return null;
    return (
        <div className={`${styles.AppointmentSyncAlert__root}`}>
            <Icon name="auto_awesome" size="1.2rem" className={`${styles.AppointmentSyncAlert__icon}`} />
            <div className={`${styles.AppointmentSyncAlert__content}`}>
                <span className={`${styles.AppointmentSyncAlert__title}`}>{t('google_calendar_adjustment')}</span>
                <p className={`${styles.AppointmentSyncAlert__text}`}>{t('completing_appointment_for')}: <em>{info}</em></p>
            </div>
        </div>
    );
};

