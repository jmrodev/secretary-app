import React from 'react';

/**
 * RequirementFeedback Feature Molecule.
 * Displays notes/responses from both doctors and administrative staff for a medical request.
 * Part of the documentary review workflow in medical_documents.
 */
const RequirementFeedback = ({ doctorNote, secretaryNote, t }) => {
    if (!doctorNote && !secretaryNote) return null;

    return (
        <div className="requirements-detail__feedback animate-fade-in">
            {doctorNote && (
                <div className="requirements-detail__feedback-item requirements-detail__feedback-item--doctor">
                    <strong className="requirements-detail__feedback-label">{t('doctor_note') || 'Nota del Doctor'}:</strong>
                    <p className="requirements-detail__feedback-text">{doctorNote}</p>
                </div>
            )}
            {secretaryNote && (
                <div className="requirements-detail__feedback-item requirements-detail__feedback-item--secretary">
                    <strong className="requirements-detail__feedback-label requirements-detail__feedback-label--secretary">{t('secretary_reply') || 'Respuesta de Secretaría'}:</strong>
                    <p className="requirements-detail__feedback-text">{secretaryNote}</p>
                </div>
            )}
        </div>
    );
};

export default RequirementFeedback;
