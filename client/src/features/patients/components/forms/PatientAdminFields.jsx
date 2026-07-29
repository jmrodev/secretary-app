import React from 'react';
import Input from '@/components/atoms/Input';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import Icon from '@/components/atoms/Icon';
import styles from './PatientAdminFields.module.css';

const EMPTY_ARRAY = [];

/**
 * PatientAdminFields Molecule.
 * Contains advanced settings only visible to administrators: doctor assignments, tariffs, and intervals.
 * Optimized for Bento Box layout.
 */
const PatientAdminFields = ({ formData, doctors = EMPTY_ARRAY, handleDoctorToggle, handleManualValueChange, updateAdminFields, t }) => {
    return (
        <article className={`${styles.root}`}>
            <header className={`${styles.header}`}>
                <Icon name="admin_panel_settings" size="1.25rem" />
                <h3 className={`${styles.title}`}>{t('administrative_control')}</h3>
            </header>

            <div className={`${styles.bento}`}>
                {/* Compact Doctor Section */}
                <section className={`${styles.section} ${styles.groupSpan12}`}>
                    <header className={`${styles.miniHeader}`}>
                        <Icon name="medical_services" size="1.1rem" />
                        <h4 className={`${styles.miniTitle}`}>{t('medical_staff_assignment')}</h4>
                        <span className={`${styles.count}`}>{formData.assignedDoctors?.length || 0}</span>
                    </header>
                    <div className={`${styles.doctorScroller}`}>
                        {doctors.map(doc => {
                            const isSelected = formData.assignedDoctors?.includes(doc.id);
                            return (
                                <label key={doc.id} className={`${styles.doctorTextTag} ${isSelected ? styles.doctorTextTagActive : ''}`}>
                                    <input
                                        type="checkbox"
                                        className={`${styles.doctorCheckbox}`}
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
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('tariff_adjustment_percent')}</label>
                    <Input
                        type="number"
                        name="tariff_percent"
                        value={formData.tariff_percent || ''}
                        onChange={updateAdminFields}
                        placeholder="10%"
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('fixed_tariff_override')}</label>
                    <CurrencyInput
                        value={formData.tariff_override || ''}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="$ 5000"
                    />
                </div>

                {/* Intervals Section */}
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('visit_interval')}</label>
                    <Input 
                        type="number" 
                        name="visit_interval_days" 
                        value={formData.visit_interval_days || ''} 
                        onChange={updateAdminFields} 
                        placeholder="30 days"
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('prescription_interval')}</label>
                    <Input 
                        type="number" 
                        name="prescription_interval_days" 
                        value={formData.prescription_interval_days || ''} 
                        onChange={updateAdminFields} 
                        placeholder="90 days"
                    />
                </div>

                {/* Dates Section */}
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>{t('next_visit')}</label>
                    <Input 
                        type="date" 
                        name="next_suggested_visit_date" 
                        value={formData.next_suggested_visit_date || ''} 
                        onChange={updateAdminFields} 
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>{t('next_prescription')}</label>
                    <Input 
                        type="date" 
                        name="next_suggested_prescription_date" 
                        value={formData.next_suggested_prescription_date || ''} 
                        onChange={updateAdminFields} 
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>{t('license_expiry')}</label>
                    <Input 
                        type="date" 
                        name="license_expiry_date" 
                        value={formData.license_expiry_date || ''} 
                        onChange={updateAdminFields} 
                    />
                </div>
            </div>
        </article>
    );
};

export default PatientAdminFields;
