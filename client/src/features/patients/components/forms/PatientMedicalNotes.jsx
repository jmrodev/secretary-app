import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import styles from './PatientMedicalNotes.module.css';

/**
 * PatientMedicalNotes Molecule.
 * Handles clinical history and medical observations.
 */
const PatientMedicalNotes = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.root}`}>
            <header className={`${styles.header}`}>
                <Icon name="history_edu" size="1.25rem" />
                <h3 className={`${styles.title}`}>{t('clinical_history')}</h3>
            </header>

            <div className={`${styles.content}`}>
                <div className={`${styles.group}`}>
                    <label className={`${styles.label}`}>{t('medical_history_notes')}</label>
                    <Input
                        type="textarea"
                        name="medical_history"
                        rows={6}
                        value={formData.medical_history || ''}
                        onChange={updatePatientData}
                        placeholder={t('medical_history_placeholder')}
                        className={`${styles.textarea}`}
                    />
                </div>
            </div>

            <footer className={`${styles.footer}`}>
                <Icon name="lock" size="0.9rem" />
                <span>{t('clinical_data_encrypted_notice')}</span>
            </footer>
        </article>
    );
};

export default PatientMedicalNotes;
