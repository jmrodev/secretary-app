import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * RescheduleBanner (Executor Component).
 * Floating banner indicating that the user is in reschedule mode for a specific patient.
 */
const RescheduleBanner = ({ rescheduleAppt, onExit, t }) => {
    if (!rescheduleAppt) return null;

    return (
        <div className="reschedule-banner-container">
            <div>
                <Icon name="rocket_launch" size="1.2rem" />
                {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
            </div>
            <Button
                variant="outline"
                size="sm"
                className="reschedule-exit-btn"
                onClick={(e) => { e.preventDefault(); onExit(); }}
            >
                {t('exit_reschedule')}
            </Button>
        </div>
    );
};

export default RescheduleBanner;
