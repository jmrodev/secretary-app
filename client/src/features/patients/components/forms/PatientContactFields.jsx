import React from 'react';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import styles from './PatientContactFields.module.css';

/**
 * PatientContactFields Molecule (Sub-Executor).
 * Manages email and multiple phone numbers through PhoneNumbersManager.
 * Optimized for Bento Box layout.
 */
const PatientContactFields = ({ formData, updatePatientData, updatePhoneNumbers, t }) => {
    return (
        <article className={`${styles.root}`}>
            

            <div className={`${styles.bento}`}>
                <div className={`${styles.group} ${styles.groupSpan5}`}>
                    <label className={`${styles.label}`}>{t('primary_email')}</label>
                    <div className={`${styles.inputWithAction}`}>
                        <Input
                            type="email"
                            name="email"
                            className="patient-contact-fields__field"
                            style={{ maxWidth: '40ch' }}
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

                <div className={`${styles.group} ${styles.groupSpan7}`}>
                    <label className={`${styles.label}`}>{t('contact_phones') || 'Teléfonos'}</label>
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
