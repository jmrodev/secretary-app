import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import styles from './PatientIdentityFields.module.css';

/**
 * PatientIdentityFields Molecule (Sub-Executor).
 * Contains primary identification: first name, last name, DNI, and DOB.
 * Optimized for Bento Box layout.
 */
const PatientIdentityFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.root}`}>
            <header className={`${styles.header}`}>
                <Icon name="person_outline" size="1.25rem" />
                <h3 className={`${styles.title}`}>{t('legal_identity')}</h3>
            </header>

            <div className={`${styles.bento}`}>
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('first_name')}</label>
                    <Input
                        name="first_name"
                        className="patient-identity-fields__field"
                        value={formData.first_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('first_name_placeholder')}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('last_name')}</label>
                    <Input
                        name="last_name"
                        className="patient-identity-fields__field"
                        value={formData.last_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('last_name_placeholder')}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>{t('dni')}</label>
                    <Input
                        name="dni"
                        className="patient-identity-fields__field"
                        value={formData.dni || ''}
                        onChange={updatePatientData}
                        required
                        placeholder="12.345.678"
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan8}`}>
                    <label className={`${styles.label}`}>{t('dob')}</label>
                    <Input
                        type="date"
                        name="dob"
                        className="patient-identity-fields__field"
                        value={formData.dob || ''}
                        onChange={updatePatientData}
                    />
                </div>
            </div>

            <footer className={`${styles.note}`}>
                <Icon name="info" size="1rem" />
                <p>{t('identity_verification_note')}</p>
            </footer>
        </article>
    );
};

export default PatientIdentityFields;
