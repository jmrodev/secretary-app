import React from 'react';

/**
 * PatientAccountFields Molecule.
 * Contains username and password fields for new patients.
 */
const PatientAccountFields = ({ formData, handleChange, t }) => {
    return (
        <div className="patient-form__row">
            <div className="patient-form__group">
                <label className="patient-form__label">{t('username')}</label>
                <input
                    type="text"
                    name="username"
                    className="patient-form__field"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                />
            </div>
            <div className="patient-form__group">
                <label className="patient-form__label">{t('password')}</label>
                <input
                    type="password"
                    name="password"
                    className="patient-form__field"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                />
            </div>
        </div>
    );
};

export default PatientAccountFields;
