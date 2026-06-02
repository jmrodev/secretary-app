import React from 'react';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import './PatientInstitutionFields.css';

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
        <article className="patient-institution-fields">
            <header className="patient-institution-fields__header">
                <Icon name="corporate_fare" size="1.25rem" />
                <h3 className="patient-institution-fields__title">{t('institutional_coverage')}</h3>
            </header>

            <div className="patient-institution-fields__bento">
                <div className="patient-institution-fields__toggle-row patient-institution-fields__group--span-12">
                    <div className="patient-institution-fields__toggle-info">
                        <span className="patient-institution-fields__toggle-label">{t('institutional_agreement')}</span>
                        <p className="patient-institution-fields__toggle-description">{t('institutional_agreement_desc')}</p>
                    </div>
                    <div className="patient-institution-fields__switch">
                        <input
                            type="checkbox"
                            checked={coveredByInstitution}
                            onChange={(e) => toggleInstitutionCoverage(e.target.checked)}
                            id="pf_institution"
                            className="patient-institution-fields__switch-input"
                        />
                        <label htmlFor="pf_institution" className="patient-institution-fields__switch-slider">
                            <span className="sr-only">{t('toggle_institution')}</span>
                        </label>
                    </div>
                </div>

                {coveredByInstitution && (
                    <div className="patient-institution-fields__group patient-institution-fields__group--span-12">
                        <label className="patient-institution-fields__label">{t('paying_institution')}</label>
                        <Select
                            name="institution_id"
                            className="patient-institution-fields__field"
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
