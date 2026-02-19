import React from 'react';

/**
 * RequirementFeedback Molecule.
 * Displays doctor or secretary notes/feedback for a medical requirement.
 */
const RequirementFeedback = ({ doctorNote, secretaryNote, t }) => {
    if (!doctorNote && !secretaryNote) return null;

    return (
        <div className="requirements-detail__feedback">
            {doctorNote && (
                <div className="requirements-detail__feedback-item">
                    <strong>{t('doctor_note')}:</strong>
                    <p>{doctorNote}</p>
                </div>
            )}
            {secretaryNote && (
                <div className="requirements-detail__feedback-item">
                    <strong>{t('secretary_reply')}:</strong>
                    <p>{secretaryNote}</p>
                </div>
            )}
        </div>
    );
};

export default RequirementFeedback;
