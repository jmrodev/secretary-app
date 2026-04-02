
import React from 'react';
import CurrencyInput from '../../../components/atoms/CurrencyInput';

/**
 * PatientAdminFields Molecule (Sub-Executor).
 * Contains advanced settings only visible to administrators: doctor assignments, tariffs, and intervals.
 */
const PatientAdminFields = ({ formData, doctors, handleDoctorToggle, handleManualValueChange, handleChange, t }) => {
    return (
        <div className="patient-form__admin-section">
            <h4 className="patient-form__section-title">{t('admin_settings') || 'Administrative Settings'}</h4>

            <div className="patient-form__group mb-4">
                <label className="patient-form__label">{t('assigned_doctors')}</label>
                <div className="patient-form__doctor-grid">
                    {doctors.map(doc => (
                        <label key={doc.id} className="patient-form__doctor-label">
                            <input
                                type="checkbox"
                                checked={formData.assignedDoctors?.includes(doc.id)}
                                onChange={() => handleDoctorToggle(doc.id)}
                            />
                            Dr. {doc.full_name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('tariff_adjustment') || 'Tariff Adjustment (%)'}</label>
                    <input
                        type="number"
                        name="tariff_percent"
                        className="patient-form__field"
                        value={formData.tariff_percent}
                        onChange={handleChange}
                        placeholder="e.g. 10"
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('tariff_override') || 'Tariff Override ($)'}</label>
                    <CurrencyInput
                        className="patient-form__field"
                        value={formData.tariff_override}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="e.g. 5000"
                    />
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('visit_interval_days')}</label>
                    <input type="number" name="visit_interval_days" className="patient-form__field" value={formData.visit_interval_days} onChange={handleChange} />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('prescription_interval_days')}</label>
                    <input type="number" name="prescription_interval_days" className="patient-form__field" value={formData.prescription_interval_days} onChange={handleChange} />
                </div>
            </div>

            <div className="patient-form__row-3">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('next_suggested_visit')}</label>
                    <input type="date" name="next_suggested_visit_date" className="patient-form__field" value={formData.next_suggested_visit_date} onChange={handleChange} />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('next_suggested_prescription')}</label>
                    <input type="date" name="next_suggested_prescription_date" className="patient-form__field" value={formData.next_suggested_prescription_date} onChange={handleChange} />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('license_expiry')}</label>
                    <input type="date" name="license_expiry_date" className="patient-form__field" value={formData.license_expiry_date} onChange={handleChange} />
                </div>
            </div>
        </div>
    );
};

export default PatientAdminFields;
