import React from 'react';
import Input from '@/components/atoms/Input';
import './PatientAccountFields.css';

/**
 * PatientAccountFields Molecule (Sub-Executor).
 * Contains username and password fields for new patient account creation.
 */
const PatientAccountFields = ({ formData, handleChange, t }) => {
    return (
        <div className="patient-account-fields">
            <div className="patient-account-fields__row">
                <div className="patient-account-fields__group">
                    <label className="patient-account-fields__label">{t('username')}</label>
                    <Input
                        type="text"
                        name="username"
                        className="patient-account-fields__field"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                    />
                </div>
                <div className="patient-account-fields__group">
                    <label className="patient-account-fields__label">{t('password')}</label>
                    <Input
                        type="password"
                        name="password"
                        className="patient-account-fields__field"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientAccountFields;
