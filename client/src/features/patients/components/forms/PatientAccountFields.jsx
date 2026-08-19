import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import styles from './PatientAccountFields.module.css';

/**
 * PatientAccountFields Molecule (Sub-Executor).
 * Contains username and password fields for new patient account creation.
 * Optimized for Bento Box layout.
 */
export const PatientAccountFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.PatientAccountFields__root}`}>
            

            <div className={`${styles.PatientAccountFields__bento}`}>
                <div className={`${styles.PatientAccountFields__group} ${styles.PatientAccountFields__groupSpan6}`}>
                    <label htmlFor="patient-username" className={`${styles.PatientAccountFields__label}`}>{t('username')}</label>
                    <Input
                        id="patient-username"
                        type="text"
                        name="username"
                        className="patient-account-fields__field"
                        value={formData.username || ''}
                        onChange={updatePatientData}
                        required
                        autoComplete="off"
                        placeholder={t('username_placeholder')}
                    />
                </div>
                <div className={`${styles.PatientAccountFields__group} ${styles.PatientAccountFields__groupSpan6}`}>
                    <label htmlFor="patient-password" className={`${styles.PatientAccountFields__label}`}>{t('password')}</label>
                    <Input
                        id="patient-password"
                        type="password"
                        name="password"
                        className="patient-account-fields__field"
                        value={formData.password || ''}
                        onChange={updatePatientData}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <footer className={`${styles.PatientAccountFields__securityNote}`}>
                <Icon name="security" size="1rem" />
                <p>{t('account_security_note')}</p>
            </footer>
        </article>
    );
};

