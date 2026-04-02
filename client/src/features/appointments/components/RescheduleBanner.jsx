import React from 'react';

/**
 * RescheduleBanner (Executor Component).
 * Floating banner indicating that the user is in reschedule mode for a specific patient.
 */
const RescheduleBanner = ({ rescheduleAppt, onExit, t }) => {
    if (!rescheduleAppt) return null;

    return (
        <div className="reschedule-banner-container">
            <div>
                🚀 {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
            </div>
            <button
                type="button" className="reschedule-exit-btn"
                onClick={(e) => { e.preventDefault(); onExit(); }}
            >
                {t('exit_reschedule')}
            </button>
        </div>
    );
};

export default RescheduleBanner;
