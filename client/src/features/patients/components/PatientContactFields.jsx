import React from 'react';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import './PatientContactFields.css';

/**
 * PatientContactFields Molecule (Sub-Executor).
 * Manages email and multiple phone numbers through PhoneNumbersManager.
 */
const PatientContactFields = ({ formData, handleChange, handlePhoneChange, t }) => {
    return (
        <div className="patient-contact-fields">
            <div className="patient-contact-fields__row">
                <div className="patient-contact-fields__group">
                    <label className="patient-contact-fields__label">{t('email') || 'Email'}</label>
                    <Input
                        type="email"
                        name="email"
                        className="patient-contact-fields__field"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {formData.email && (
                        <Button
                            to={`mailto:${formData.email}`}
                            variant="link"
                            size="sm"
                            className="patient-contact-fields__email-link"
                            icon={<Icon name="mail" size="1rem" />}
                        >
                            {t('send_email')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="patient-contact-fields__section-divider">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={handlePhoneChange}
                />
            </div>
        </div>
    );
};

export default PatientContactFields;
