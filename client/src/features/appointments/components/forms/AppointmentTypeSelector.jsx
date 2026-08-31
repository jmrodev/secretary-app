import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './AppointmentTypeSelector.module.css';

/**
 * AppointmentTypeSelector Molecule (Internal to feature).
 * Simple toggle between consultation (presencial) and virtual appointments.
 */
export const AppointmentTypeSelector = ({ type, onChange, t }) => {
    const isVirtual = type === 'virtual';

    return (
        <div className={`${styles.AppointmentTypeSelector__root}`}>
            <Button
                type="button"
                className={`${styles.AppointmentTypeSelector__btn} ${!isVirtual ? styles.AppointmentTypeSelector__btnActive : ''}`}
                onClick={() => onChange('consultation')}
                unstyled
            >
                <Icon name="person" size="1.2rem" className={`${styles.AppointmentTypeSelector__icon}`} />
                <span>{t('in_person')}</span>
            </Button>
            <Button
                type="button"
                className={`${styles.AppointmentTypeSelector__btn} ${isVirtual ? styles.AppointmentTypeSelector__btnActive : ''}`}
                onClick={() => onChange('virtual')}
                unstyled
            >
                <Icon name="videocam" size="1.2rem" className={`${styles.AppointmentTypeSelector__icon}`} />
                <span>{t('virtual_type')}</span>
            </Button>
        </div>
    );
};

