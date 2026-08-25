import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import styles from './PatientMedicalNotes.module.css';

/**
 * PatientMedicalNotes Molecule.
 * Handles clinical history and institution coverage.
 */
export const PatientMedicalNotes = ({ formData, updatePatientData, institutions, t }) => {
    const institutionOptions = React.useMemo(() => {
        const safeInstitutions = Array.isArray(institutions) ? institutions : (institutions?.institutions || []);
        return [
            { value: '', label: t('select_institution') },
            ...safeInstitutions.reduce((acc, inst) => {
                if (inst.status === 'active') {
                    acc.push({ value: inst.id, label: inst.name });
                }
                return acc;
            }, [])
        ];
    }, [institutions, t]);

    return (
        <article className={`${styles.PatientMedicalNotes__root}`}>
            

            <div className={`${styles.PatientMedicalNotes__content}`}>
                <div className={`${styles.PatientMedicalNotes__group} ${styles.groupInstitution}`}>
                    <label htmlFor="patient-paying-institution" className={`${styles.PatientMedicalNotes__label}`}>{t('paying_institution')}</label>
                    <Select
                        id="patient-paying-institution"
                        name="institution_id"
                        value={formData.institution_id || ''}
                        options={institutionOptions}
                        onChange={updatePatientData}
                    />
                </div>

                <div className={`${styles.PatientMedicalNotes__group}`}>
                    <label htmlFor="patient-medical-history" className={`${styles.PatientMedicalNotes__label}`}>{t('medical_history_notes')}</label>
                    <Input
                        id="patient-medical-history"
                        type="textarea"
                        name="medical_history"
                        rows={4}
                        value={formData.medical_history || ''}
                        onChange={updatePatientData}
                        placeholder={t('medical_history_placeholder')}
                        className={`${styles.PatientMedicalNotes__textarea}`}
                    />
                </div>
            </div>

        </article>
    );
};

