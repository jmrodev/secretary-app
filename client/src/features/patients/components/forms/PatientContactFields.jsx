import React from 'react';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import './PatientContactFields.css';

/**
 * PatientContactFields Molecule (Sub-Executor).
 * Manages email and multiple phone numbers through PhoneNumbersManager.
 * Optimized for Bento Box layout.
 */
const PatientContactFields = ({ formData, updatePatientData, updatePhoneNumbers, t }) => {
    return (
        <article className="patient-contact-fields">
            <header className="patient-contact-fields__header">
                <Icon name="smartphone" size="1.25rem" />
                <h3 className="patient-contact-fields__title">{t('contact_phones')}</h3>
            </header>

            <div className="patient-contact-fields__bento">
                <div className="patient-contact-fields__group patient-contact-fields__group--span-12">
                    <label className="patient-contact-fields__label">{t('primary_email')}</label>
                    <div className="patient-contact-fields__input-with-action">
                        <Input
                            type="email"
                            name="email"
                            className="patient-contact-fields__field"
                            value={formData.email || ''}
                            onChange={updatePatientData}
                            placeholder="paciente@ejemplo.com"
                        />
                        {formData.email && (
                            <Button
                                to={`mailto:${formData.email}`}
                                variant="secondary"
                                size="sm"
                                className="patient-contact-fields__email-btn"
                                icon={<Icon name="send" size="0.9rem" />}
                            />
                        )}
                    </div>
                </div>

                <div className="patient-contact-fields__phones patient-contact-fields__group--span-12">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={updatePhoneNumbers}
                    />
                </div>
            </div>
        </article>
    );
};

export default PatientContactFields;
