import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
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
        <article className={`${styles.root}`}>
            

            <div className={`${styles.content}`}>
                <div className={`${styles.group} ${styles.groupInstitution}`}>
                    <label className={`${styles.label}`}>{t('paying_institution')}</label>
                    <Select
                        name="institution_id"
                        value={formData.institution_id || ''}
                        options={institutionOptions}
                        onChange={updatePatientData}
                    />
                </div>

                <div className={`${styles.group}`}>
                    <label className={`${styles.label}`}>{t('medical_history_notes')}</label>
                    <Input
                        type="textarea"
                        name="medical_history"
                        rows={4}
                        value={formData.medical_history || ''}
                        onChange={updatePatientData}
                        placeholder={t('medical_history_placeholder')}
                        className={`${styles.textarea}`}
                    />
                </div>
            </div>

        </article>
    );
};

