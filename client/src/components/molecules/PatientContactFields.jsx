import React from 'react';
import PhoneNumbersManager from './PhoneNumbersManager';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * PatientContactFields Molecule.
 * Manages email and multiple phone numbers.
 */
const PatientContactFields = ({ formData, handleChange, handlePhoneChange, t }) => {
    return (
        <div className="patient-form__section">
            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="patient-form__field"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {formData.email && (
                        <Button
                            to={`mailto:${formData.email}`}
                            variant="link"
                            size="sm"
                            className="patient-form__email-link"
                            icon={<Icon name="mail" size="1rem" />}
                        >
                            {t('send_email')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="patient-form__section-divider">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={handlePhoneChange}
                />
            </div>
        </div>
    );
};

export default PatientContactFields;
