import React from 'react';
import Icon from '../../../components/atoms/Icon';

/**
 * AppointmentTypeSelector Molecule (Internal to feature).
 * Simple toggle between consultation (presencial) and virtual appointments.
 */
const AppointmentTypeSelector = ({ type, onChange, t }) => {
    const isVirtual = type === 'virtual';

    return (
        <div className="input-group">
            <label className="form-label">{t('appointment_type') || 'Tipo de Turno'}</label>
            <div className="appointment-type-selector">
                <button
                    type="button"
                    className={`appointment-type-selector__btn ${!isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                    onClick={() => onChange('consultation')}
                >
                    <Icon name="person" size="1.2rem" />
                    <span>{t('in_person') || 'Presencial'}</span>
                </button>
                <button
                    type="button"
                    className={`appointment-type-selector__btn ${isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                    onClick={() => onChange('virtual')}
                >
                    <Icon name="videocam" size="1.2rem" />
                    <span>{t('virtual_type') || 'Virtual'}</span>
                </button>
            </div>
        </div>
    );
};

export default AppointmentTypeSelector;
