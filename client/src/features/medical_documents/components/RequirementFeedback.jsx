import React from 'react';

/**
 * RequirementFeedback Feature Molecule.
 * Displays notes/responses from both doctors and administrative staff for a medical request.
 * Crucial for the internal communication flow in medical_documents.
 */
const RequirementFeedback = ({ doctorNote, secretaryNote, t }) => {
    if (!doctorNote && !secretaryNote) return null;

    return (
        <div className="requirements-detail__feedback animate-fadeIn mt-6 p-4 bg-gray-50 rounded-sm border border-gray-100">
            {doctorNote && (
                <div className="requirements-detail__feedback-item mb-3">
                    <strong className="block text-sm font-bold text-accent mb-1 underline">{t('doctor_note') || 'Nota del Doctor'}:</strong>
                    <p className="text-sm italic text-gray-700">{doctorNote}</p>
                </div>
            )}
            {secretaryNote && (
                <div className="requirements-detail__feedback-item">
                    <strong className="block text-sm font-bold text-blue-600 mb-1 underline">{t('secretary_reply') || 'Respuesta de Secretaría'}:</strong>
                    <p className="text-sm italic text-gray-700">{secretaryNote}</p>
                </div>
            )}
        </div>
    );
};

export default RequirementFeedback;
