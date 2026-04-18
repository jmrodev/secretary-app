
import React from 'react';
import Input from '@/components/atoms/Input';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import './PatientAdminFields.css';

/**
 * PatientAdminFields Molecule.
 * Contains advanced settings only visible to administrators: doctor assignments, tariffs, and intervals.
 */
const PatientAdminFields = ({ formData, doctors = [], handleDoctorToggle, handleManualValueChange, handleChange, t }) => {
    return (
        <div className="patient-admin-fields">
            <h4 className="patient-admin-fields__section-title">
                {t('admin_settings')}
            </h4>

            <div className="patient-admin-fields__group">
                <label className="patient-admin-fields__label">
                    {t('assigned_doctors')}
                </label>
                <div className="patient-admin-fields__doctor-grid">
                    {doctors.map(doc => (
                        <label key={doc.id} className="patient-admin-fields__doctor-item">
                            <input
                                type="checkbox"
                                className="patient-admin-fields__doctor-checkbox"
                                checked={formData.assignedDoctors?.includes(doc.id)}
                                onChange={() => handleDoctorToggle(doc.id)}
                            />
                            Dr. {doc.full_name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="patient-admin-fields__row">
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('tariff_adjustment')}
                    </label>
                    <Input
                        type="number"
                        name="tariff_percent"
                        value={formData.tariff_percent}
                        onChange={handleChange}
                        placeholder="10"
                    />
                </div>
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('tariff_override')}
                    </label>
                    <CurrencyInput
                        value={formData.tariff_override}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="5000"
                    />
                </div>
            </div>

            <div className="patient-admin-fields__row">
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('visit_interval_days')}
                    </label>
                    <Input 
                        type="number" 
                        name="visit_interval_days" 
                        value={formData.visit_interval_days} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('prescription_interval_days')}
                    </label>
                    <Input 
                        type="number" 
                        name="prescription_interval_days" 
                        value={formData.prescription_interval_days} 
                        onChange={handleChange} 
                    />
                </div>
            </div>

            <div className="patient-admin-fields__row--tri">
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('next_suggested_visit')}
                    </label>
                    <Input 
                        type="date" 
                        name="next_suggested_visit_date" 
                        value={formData.next_suggested_visit_date} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('next_suggested_prescription')}
                    </label>
                    <Input 
                        type="date" 
                        name="next_suggested_prescription_date" 
                        value={formData.next_suggested_prescription_date} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="patient-admin-fields__group">
                    <label className="patient-admin-fields__label">
                        {t('license_expiry')}
                    </label>
                    <Input 
                        type="date" 
                        name="license_expiry_date" 
                        value={formData.license_expiry_date} 
                        onChange={handleChange} 
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientAdminFields;
