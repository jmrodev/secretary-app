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
<<<<<<< HEAD
                <Icon name="rocket_launch" size="1.2rem" />
                {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
            </div>
            <Button
                variant="outline"
                size="sm"
                className="reschedule-exit-btn"
=======
                <Icon name="rocket_launch" size="1rem" className="mr-1" />
                {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
            </div>
            <Button
                type="button" className="reschedule-exit-btn"
>>>>>>> main
                onClick={(e) => { e.preventDefault(); onExit(); }}
                unstyled
            >
                {t('exit_reschedule')}
            </Button>
        </div>
    );
};

export default RescheduleBanner;
