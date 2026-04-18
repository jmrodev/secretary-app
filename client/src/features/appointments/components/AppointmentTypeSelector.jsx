import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * AppointmentTypeSelector Molecule (Internal to feature).
 * Simple toggle between consultation (presencial) and virtual appointments.
 */
const AppointmentTypeSelector = ({ type, onChange, t }) => {
    const isVirtual = type === 'virtual';

    return (
        <div className="input-group">
            <label className="form-label">{t('appointment_type')}</label>
            <div className="appointment-type-selector">
                <Button
<<<<<<< HEAD
                    variant="ghost"
                    active={!isVirtual}
                    className="appointment-type-selector__btn"
                    onClick={() => onChange('consultation')}
                    icon={<Icon name="person" size="1.2rem" />}
                >
                    {t('in_person')}
                </Button>
                <Button
                    variant="ghost"
                    active={isVirtual}
                    className="appointment-type-selector__btn"
                    onClick={() => onChange('virtual')}
                    icon={<Icon name="videocam" size="1.2rem" />}
                >
                    {t('virtual_type')}
=======
                    type="button"
                    className={`appointment-type-selector__btn ${!isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                    onClick={() => onChange('consultation')}
                    unstyled
                >
                    <Icon name="person" size="1.2rem" />
                    <span>{t('in_person') || 'Presencial'}</span>
                </Button>
                <Button
                    type="button"
                    className={`appointment-type-selector__btn ${isVirtual ? 'appointment-type-selector__btn--active' : ''}`}
                    onClick={() => onChange('virtual')}
                    unstyled
                >
                    <Icon name="videocam" size="1.2rem" />
                    <span>{t('virtual_type') || 'Virtual'}</span>
>>>>>>> main
                </Button>
            </div>
        </div>
    );
};

export default AppointmentTypeSelector;
