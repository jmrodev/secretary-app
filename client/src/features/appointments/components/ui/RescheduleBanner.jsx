import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './RescheduleBanner.module.css';

/**
 * RescheduleBanner (Executor Component).
 * Floating banner indicating that the user is in reschedule mode for a specific patient.
 */
const RescheduleBanner = ({ rescheduleAppt, onExit, t }) => {
    if (!rescheduleAppt) return null;

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.content}`}>
                <Icon name="rocket_launch" className={`${styles.icon}`} />
                <span>
                    {t('rescheduling_mode')}: <strong className={`${styles.patient}`}>{rescheduleAppt.patient_name}</strong>. 
                    <span className={`${styles.instruction}`}> {t('reschedule_instruction')}</span>
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={`${styles.exitBtn}`}
                onClick={(e) => { e.preventDefault(); onExit(); }}
            >
                {t('exit_reschedule')}
            </Button>
        </div>
    );
};

export default RescheduleBanner;
