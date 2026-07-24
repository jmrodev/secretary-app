import React from 'react';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import styles from './PatientInstitutionFields.module.css';

/**
 * PatientInstitutionFields Molecule (Sub-Executor).
 * Manages settings for institutional coverage (e.g., Hospital, Municipality).
 * Optimized for Bento Box layout.
 */
const PatientInstitutionFields = ({ coveredByInstitution, toggleInstitutionCoverage, formData, updatePatientData, institutions, t }) => {
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
            <header className={`${styles.header}`}>
                <Icon name="corporate_fare" size="1.25rem" />
                <h3 className={`${styles.title}`}>{t('institutional_coverage')}</h3>
            </header>

            <div className={`${styles.bento}`}>
                <div className={`${styles.toggleRow} ${styles.groupSpan12}`}>
                    <div className={`${styles.toggleInfo}`}>
                        <span className={`${styles.toggleLabel}`}>{t('institutional_agreement')}</span>
                        <p className={`${styles.toggleDescription}`}>{t('institutional_agreement_desc')}</p>
                    </div>
                    <div className={`${styles.switch}`}>
                        <input
                            type="checkbox"
                            checked={coveredByInstitution}
                            onChange={(e) => toggleInstitutionCoverage(e.target.checked)}
                            id="pf_institution"
                            className={`${styles.switchInput}`}
                        />
                        <label htmlFor="pf_institution" className={`${styles.switchSlider}`}>
                            <span className="sr-only">{t('toggle_institution')}</span>
                        </label>
                    </div>
                </div>

                {coveredByInstitution && (
                    <div className={`${styles.group} ${styles.groupSpan12}`}>
                        <label className={`${styles.label}`}>{t('paying_institution')}</label>
                        <Select
                            name="institution_id"
                            className={`${styles.field}`}
                            value={formData.institution_id || ''}
                            options={institutionOptions}
                            onChange={updatePatientData}
                        />
                    </div>
                )}
            </div>
        </article>
    );
};

export default PatientInstitutionFields;
