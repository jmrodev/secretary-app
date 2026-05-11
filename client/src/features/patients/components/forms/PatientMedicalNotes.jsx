import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import './PatientMedicalNotes.css';

/**
 * PatientMedicalNotes Molecule.
 * Handles clinical history and medical observations.
 */
const PatientMedicalNotes = ({ formData, handleChange, t }) => {
    return (
        <article className="patient-medical-notes">
            <header className="patient-medical-notes__header">
                <Icon name="history_edu" size="1.25rem" />
                <h3 className="patient-medical-notes__title">{t('clinical_history')}</h3>
            </header>

            <div className="patient-medical-notes__content">
                <div className="patient-medical-notes__group">
                    <label className="patient-medical-notes__label">{t('medical_history_notes')}</label>
                    <Input
                        type="textarea"
                        name="medical_history"
                        rows={6}
                        value={formData.medical_history || ''}
                        onChange={handleChange}
                        placeholder={t('medical_history_placeholder')}
                        className="patient-medical-notes__textarea"
                    />
                </div>
            </div>

            <footer className="patient-medical-notes__footer">
                <Icon name="lock" size="0.9rem" />
                <span>{t('clinical_data_encrypted_notice')}</span>
            </footer>
        </article>
    );
};

export default PatientMedicalNotes;
