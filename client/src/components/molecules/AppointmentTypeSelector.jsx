import React from 'react';

/**
 * AppointmentTypeSelector Molecule.
 * Toggle buttons to switch between consultation types (e.g., Presencial/Virtual).
 */
const AppointmentTypeSelector = ({ type, onChange, t }) => {
    return (
        <div className="input-group">
            <label className="form-label">Tipo de Turno</label>
            <div className="appointment-type-selector">
                <button
                    type="button"
                    className={`btn btn-sm ${type === 'consultation' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => onChange('consultation')}
                >
                    🏢 Presencial
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${type === 'virtual' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => onChange('virtual')}
                >
                    📹 Videollamada
                </button>
            </div>
        </div>
    );
};

export default AppointmentTypeSelector;
