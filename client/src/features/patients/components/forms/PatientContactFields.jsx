import React from 'react';
import { PhoneNumbersManager } from '@/components/molecules/PhoneNumbersManager';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import styles from './PatientContactFields.module.css';

/**
 * PatientContactFields Molecule (Sub-Executor).
 * Manages email and multiple phone numbers through PhoneNumbersManager.
 * Optimized for Bento Box layout.
 */
export const PatientContactFields = ({ formData, updatePatientData, updatePhoneNumbers, t }) => {
    return (
        <article className={`${styles.PatientContactFields__root}`}>
            

            <div className={`${styles.PatientContactFields__bento}`}>
                <div className={`${styles.PatientContactFields__group} ${styles.PatientContactFields__groupSpan5}`}>
                    <label htmlFor="patient-email" className={`${styles.PatientContactFields__label}`}>{t('primary_email')}</label>
                    <div className={`${styles.PatientContactFields__inputWithAction}`}>
                        <Input
                            id="patient-email"
                            type="email"
                            name="email"
                            className={`patient-contact-fields__field ${styles.PatientContactFields__fieldMaxWidth40}`}
                            value={formData.email || ''}
                            onChange={updatePatientData}
                            placeholder={t('patient_email_placeholder')}
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

                <div className={`${styles.PatientContactFields__group} ${styles.PatientContactFields__groupSpan7}`}>
                    <span className={`${styles.PatientContactFields__label}`}>{t('contact_phones')}</span>
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={updatePhoneNumbers}
                    />
                </div>
            </div>
        </article>
    );
};

