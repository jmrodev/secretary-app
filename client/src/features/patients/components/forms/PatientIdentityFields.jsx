import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import styles from './PatientIdentityFields.module.css';

/**
 * PatientIdentityFields Molecule (Sub-Executor).
 * Contains primary identification: first name, last name, DNI, and DOB.
 * Optimized for Bento Box layout.
 */
export const PatientIdentityFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.PatientIdentityFields__root}`}>
            

            <div className={`${styles.PatientIdentityFields__bento}`}>
                <div className={`${styles.PatientIdentityFields__group} ${styles.PatientIdentityFields__groupSpan3}`}>
                    <label className={`${styles.PatientIdentityFields__label}`}>{t('first_name')}</label>
                    <Input
                        name="first_name"
                        className="patient-identity-fields__field"
                        value={formData.first_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('first_name_placeholder')}
                        minLength="2"
                        maxLength="50"
                        pattern="[A-Za-zÀ-ÿ\s]+"
                        title="Debe contener solo letras y espacios"
                    />
                </div>
                <div className={`${styles.PatientIdentityFields__group} ${styles.PatientIdentityFields__groupSpan3}`}>
                    <label className={`${styles.PatientIdentityFields__label}`}>{t('last_name')}</label>
                    <Input
                        name="last_name"
                        className="patient-identity-fields__field"
                        value={formData.last_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('last_name_placeholder')}
                        minLength="2"
                        maxLength="50"
                        pattern="[A-Za-zÀ-ÿ\s]+"
                        title="Debe contener solo letras y espacios"
                    />
                </div>
                <div className={`${styles.PatientIdentityFields__group} ${styles.PatientIdentityFields__groupSpan2}`}>
                    <label className={`${styles.PatientIdentityFields__label}`}>{t('dni')}</label>
                    <Input
                        name="dni"
                        className="patient-identity-fields__field"
                        value={formData.dni || ''}
                        onChange={updatePatientData}
                        required
                        placeholder="12.345.678"
                        htmlSize="10"
                        minLength="7"
                        maxLength="10"
                        pattern="[0-9\.]+"
                        title="Solo números y puntos. Ej: 12.345.678 o 12345678"
                    />
                </div>
                <div className={`${styles.PatientIdentityFields__group} ${styles.PatientIdentityFields__groupSpan4}`}>
                    <label className={`${styles.PatientIdentityFields__label}`}>{t('dob')}</label>
                    <Input
                        type="date"
                        name="dob"
                        className="patient-identity-fields__field"
                        value={formData.dob || ''}
                        onChange={updatePatientData}
                        required
                    />
                </div>
            </div>

        </article>
    );
};

