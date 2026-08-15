import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './RescheduleBanner.module.css';

/**
 * RescheduleBanner (Executor Component).
 * Floating banner indicating that the user is in reschedule mode for a specific patient.
 */
export const RescheduleBanner = ({ rescheduleAppt, onExit, t }) => {
    if (!rescheduleAppt) return null;

    return (
        <div className={`${styles.RescheduleBanner__root}`}>
            <div className={`${styles.RescheduleBanner__content}`}>
                <Icon name="rocket_launch" className={`${styles.RescheduleBanner__icon}`} />
                <span>
                    {t('rescheduling_mode')}: <strong className={`${styles.RescheduleBanner__patient}`}>{rescheduleAppt.patient_name}</strong>. 
                    <span className={`${styles.RescheduleBanner__instruction}`}> {t('reschedule_instruction')}</span>
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={`${styles.RescheduleBanner__exitBtn}`}
                onClick={(e) => { e.preventDefault(); onExit(); }}
            >
                {t('exit_reschedule')}
            </Button>
        </div>
    );
};

