
import React from 'react';

/**
 * PatientInstitutionFields Molecule (Sub-Executor).
 * Manages settings for institutional coverage (e.g., Hospital, Municipality).
 */
const PatientInstitutionFields = ({ coveredByInstitution, handleInstitutionToggle, formData, handleChange, institutions, t }) => {
    return (
        <div className="patient-form__section-divider">
            <div className="patient-form__checkbox-row">
                <input
                    type="checkbox"
                    checked={coveredByInstitution}
                    onChange={(e) => handleInstitutionToggle(e.target.checked)}
                    id="pf_institution"
                />
                <label htmlFor="pf_institution" className="patient-form__checkbox-label">
                    {t('covered_by_institution_prompt') || '¿Cubierto por una Institución? (Municipio, Hospital, etc.)'}
                </label>
            </div>

            {coveredByInstitution && (
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('paying_institution') || 'Institución Pagadora'}</label>
                    <select
                        name="institution_id"
                        className="patient-form__field"
                        value={formData.institution_id}
                        onChange={handleChange}
                    >
                        <option value="">{t('select_institution') || 'Seleccionar Institución...'}</option>
                        {institutions.filter(i => i.status === 'active').map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default PatientInstitutionFields;
