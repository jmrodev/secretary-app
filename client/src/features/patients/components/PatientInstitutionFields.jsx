import React from 'react';
import Select from '@/components/atoms/Select';
import './PatientInstitutionFields.css';

/**
 * PatientInstitutionFields Molecule (Sub-Executor).
 * Manages settings for institutional coverage (e.g., Hospital, Municipality).
 */
const PatientInstitutionFields = ({ coveredByInstitution, handleInstitutionToggle, formData, handleChange, institutions, t }) => {
    const institutionOptions = [
        { value: '', label: t('select_institution') || 'Seleccionar Institución...' },
        ...institutions.filter(i => i.status === 'active').map(inst => ({ value: inst.id, label: inst.name }))
    ];

    return (
        <div className="patient-institution-fields">
            <div className="patient-institution-fields__section-divider">
                <div className="patient-institution-fields__checkbox-row">
                    <input
                        type="checkbox"
                        checked={coveredByInstitution}
                        onChange={(e) => handleInstitutionToggle(e.target.checked)}
                        id="pf_institution"
                    />
                    <label htmlFor="pf_institution" className="patient-institution-fields__checkbox-label">
                        {t('covered_by_institution_prompt') || '¿Cubierto por una Institución? (Municipio, Hospital, etc.)'}
                    </label>
                </div>

                {coveredByInstitution && (
                    <div className="patient-institution-fields__group">
                        <label className="patient-institution-fields__label">{t('paying_institution') || 'Institución Pagadora'}</label>
                        <Select
                            name="institution_id"
                            className="patient-institution-fields__field"
                            value={formData.institution_id}
                            options={institutionOptions}
                            onChange={handleChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientInstitutionFields;
