import React from 'react';
import Input from '@/components/atoms/Input';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import Icon from '@/components/atoms/Icon';
import './PatientAdminFields.css';

/**
 * PatientAdminFields Molecule.
 * Contains advanced settings only visible to administrators: doctor assignments, tariffs, and intervals.
 * Optimized for Bento Box layout.
 */
const PatientAdminFields = ({ formData, doctors = [], handleDoctorToggle, handleManualValueChange, handleChange, t }) => {
    return (
        <article className="patient-admin-fields">
            <header className="patient-admin-fields__header">
                <Icon name="admin_panel_settings" size="1.25rem" />
                <h3 className="patient-admin-fields__title">{t('administrative_control')}</h3>
            </header>

            <div className="patient-admin-fields__bento">
                {/* Compact Doctor Section */}
                <section className="patient-admin-fields__section patient-admin-fields__group--span-12">
                    <header className="patient-admin-fields__mini-header">
                        <Icon name="medical_services" size="1.1rem" />
                        <h4 className="patient-admin-fields__mini-title">{t('medical_staff_assignment')}</h4>
                        <span className="patient-admin-fields__count">{formData.assignedDoctors?.length || 0}</span>
                    </header>
                    <div className="patient-admin-fields__doctor-scroller">
                        {doctors.map(doc => {
                            const isSelected = formData.assignedDoctors?.includes(doc.id);
                            return (
                                <label key={doc.id} className={`patient-admin-fields__doctor-text-tag ${isSelected ? 'patient-admin-fields__doctor-text-tag--active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        className="patient-admin-fields__doctor-checkbox"
                                        checked={isSelected}
                                        onChange={() => handleDoctorToggle(doc.id)}
                                    />
                                    {isSelected && <Icon name="check_circle" size="0.75rem" />}
                                    <span>{doc.full_name}</span>
                                </label>
                            );
                        })}
                    </div>
                </section>

                {/* Tariff Section */}
                <div className="patient-admin-fields__group patient-admin-fields__group--span-6">
                    <label className="patient-admin-fields__label">{t('tariff_adjustment_percent')}</label>
                    <Input
                        type="number"
                        name="tariff_percent"
                        value={formData.tariff_percent || ''}
                        onChange={handleChange}
                        placeholder="10%"
                    />
                </div>
                <div className="patient-admin-fields__group patient-admin-fields__group--span-6">
                    <label className="patient-admin-fields__label">{t('fixed_tariff_override')}</label>
                    <CurrencyInput
                        value={formData.tariff_override || ''}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="$ 5000"
                    />
                </div>

                {/* Intervals Section */}
                <div className="patient-admin-fields__group patient-admin-fields__group--span-6">
                    <label className="patient-admin-fields__label">{t('visit_interval')}</label>
                    <Input 
                        type="number" 
                        name="visit_interval_days" 
                        value={formData.visit_interval_days || ''} 
                        onChange={handleChange} 
                        placeholder="30 days"
                    />
                </div>
                <div className="patient-admin-fields__group patient-admin-fields__group--span-6">
                    <label className="patient-admin-fields__label">{t('prescription_interval')}</label>
                    <Input 
                        type="number" 
                        name="prescription_interval_days" 
                        value={formData.prescription_interval_days || ''} 
                        onChange={handleChange} 
                        placeholder="90 days"
                    />
                </div>

                {/* Dates Section */}
                <div className="patient-admin-fields__group patient-admin-fields__group--span-4">
                    <label className="patient-admin-fields__label">{t('next_visit')}</label>
                    <Input 
                        type="date" 
                        name="next_suggested_visit_date" 
                        value={formData.next_suggested_visit_date || ''} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="patient-admin-fields__group patient-admin-fields__group--span-4">
                    <label className="patient-admin-fields__label">{t('next_prescription')}</label>
                    <Input 
                        type="date" 
                        name="next_suggested_prescription_date" 
                        value={formData.next_suggested_prescription_date || ''} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="patient-admin-fields__group patient-admin-fields__group--span-4">
                    <label className="patient-admin-fields__label">{t('license_expiry')}</label>
                    <Input 
                        type="date" 
                        name="license_expiry_date" 
                        value={formData.license_expiry_date || ''} 
                        onChange={handleChange} 
                    />
                </div>
            </div>
        </article>
    );
};

export default PatientAdminFields;
