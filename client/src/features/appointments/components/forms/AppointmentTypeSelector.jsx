import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './AppointmentTypeSelector.css';

/**
 * AppointmentTypeSelector Molecule (Internal to feature).
 * Simple toggle between consultation (presencial) and virtual appointments.
 */
const AppointmentTypeSelector = ({ type, onChange, t }) => {
    const isVirtual = type === 'virtual';

    return (
        <div className="appointment-type-selector">
            <Button
                type="button"
                className={`appointment-type-selector__btn ${!isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                onClick={() => onChange('consultation')}
                unstyled
            >
                <Icon name="person" size="1.2rem" className="appointment-type-selector__icon" />
                <span>{t('in_person') || 'Presencial'}</span>
            </Button>
            <Button
                type="button"
                className={`appointment-type-selector__btn ${isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                onClick={() => onChange('virtual')}
                unstyled
            >
                <Icon name="videocam" size="1.2rem" className="appointment-type-selector__icon" />
                <span>{t('virtual_type') || 'Virtual'}</span>
            </Button>
        </div>
    );
};

export default AppointmentTypeSelector;
