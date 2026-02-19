import React from 'react';

/**
 * AppointmentSyncAlert Molecule.
 * Displays reference info from external sources (e.g., WhatsApp sync) to help identify the patient.
 */
const AppointmentSyncAlert = ({ info }) => {
    if (!info) return null;

    return (
        <div className="reference-box">
            <span className="reference-box__label">📄 Información Original (Referencia)</span>
            <div className="reference-box__content">
                {info}
            </div>
            <p className="reference-box__hint">
                Utilice esta información para buscar al paciente correcto.
            </p>
        </div>
    );
};

export default AppointmentSyncAlert;
