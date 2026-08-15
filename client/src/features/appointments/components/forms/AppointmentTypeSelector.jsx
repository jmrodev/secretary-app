import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './AppointmentTypeSelector.module.css';

/**
 * AppointmentTypeSelector Molecule (Internal to feature).
 * Simple toggle between consultation (presencial) and virtual appointments.
 */
export const AppointmentTypeSelector = ({ type, onChange, t }) => {
    const isVirtual = type === 'virtual';

    return (
        <div className={`${styles.root}`}>
            <Button
                type="button"
                className={`${styles.btn} ${!isVirtual ? styles.btnActive : ''}`}
                onClick={() => onChange('consultation')}
                unstyled
            >
                <Icon name="person" size="1.2rem" className={`${styles.icon}`} />
                <span>{t('in_person') || 'Presencial'}</span>
            </Button>
            <Button
                type="button"
                className={`${styles.btn} ${isVirtual ? styles.btnActive : ''}`}
                onClick={() => onChange('virtual')}
                unstyled
            >
                <Icon name="videocam" size="1.2rem" className={`${styles.icon}`} />
                <span>{t('virtual_type') || 'Virtual'}</span>
            </Button>
        </div>
    );
};

