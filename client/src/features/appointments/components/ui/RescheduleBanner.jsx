import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './RescheduleBanner.css';

/**
 * RescheduleBanner (Executor Component).
 * Floating banner indicating that the user is in reschedule mode for a specific patient.
 */
const RescheduleBanner = ({ rescheduleAppt, onExit, t }) => {
    if (!rescheduleAppt) return null;

    return (
        <div className="reschedule-banner">
            <div className="reschedule-banner__content">
                <Icon name="rocket_launch" className="reschedule-banner__icon" />
                <span>
                    {t('rescheduling_mode')}: <strong className="reschedule-banner__patient">{rescheduleAppt.patient_name}</strong>. 
                    <span className="reschedule-banner__instruction"> {t('reschedule_instruction')}</span>
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="reschedule-banner__exit-btn"
                onClick={(e) => { e.preventDefault(); onExit(); }}
            >
                {t('exit_reschedule')}
            </Button>
        </div>
    );
};

export default RescheduleBanner;
