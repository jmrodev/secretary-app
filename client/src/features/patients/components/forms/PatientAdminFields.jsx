import React from 'react';
import { Input } from '@/components/atoms/Input';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { Icon } from '@/components/atoms/Icon';
import styles from './PatientAdminFields.module.css';

const EMPTY_ARRAY = [];

/**
 * PatientAdminFields Molecule.
 * Contains advanced settings only visible to administrators: doctor assignments, tariffs, and intervals.
 * Optimized for Bento Box layout.
 */
export const PatientAdminFields = ({ formData, doctors = EMPTY_ARRAY, handleDoctorToggle, handleManualValueChange, updateAdminFields, t }) => {
    const assignedDoctorSet = new Set(formData.assignedDoctors || []);
    return (
        <article className={`${styles.PatientAdminFields__root}`}>
            

            <div className={`${styles.PatientAdminFields__bento}`}>
                {/* Compact Doctor Section */}
                <section className={`${styles.PatientAdminFields__section} ${styles.PatientAdminFields__groupSpan12}`}>
                    <header className={`${styles.PatientAdminFields__miniHeader}`}>
                        <Icon name="medical_services" size="1.1rem" />
                        <h4 className={`${styles.PatientAdminFields__miniTitle}`}>Médicos Asignados</h4>
                        <span className={`${styles.PatientAdminFields__count}`}>{formData.assignedDoctors?.length || 0}</span>
                    </header>
                    <div className={`${styles.PatientAdminFields__doctorScroller}`}>
                        {doctors.map(doc => {
                            const isSelected = assignedDoctorSet.has(doc.id);
                            return (
                                <label key={doc.id} className={`${styles.PatientAdminFields__doctorTextTag} ${isSelected ? styles.PatientAdminFields__doctorTextTagActive : ''}`}>
                                    <input
                                        type="checkbox"
                                        className={`${styles.PatientAdminFields__doctorCheckbox}`}
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
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan3}`}>
                    <label htmlFor="admin-tariff-percent" className={`${styles.PatientAdminFields__label}`}>{t('admin_tariff_percent') || 'Ajuste Tarifa (%)'}</label>
                    <Input
                        id="admin-tariff-percent"
                        type="number"
                        name="tariff_percent"
                        value={formData.tariff_percent || ''}
                        onChange={updateAdminFields}
                        placeholder="10"
                        min="0"
                        max="100"
                        step="1"
                        style={{ width: '12ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan3}`}>
                    <label htmlFor="admin-tariff-override" className={`${styles.PatientAdminFields__label}`}>{t('admin_fixed_tariff') || 'Tarifa Fija'}</label>
                    <CurrencyInput
                        id="admin-tariff-override"
                        value={formData.tariff_override || ''}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="$ 5000"
                        style={{ width: '16ch', flexGrow: 0 }}
                    />
                </div>

                {/* Intervals Section */}
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan3}`}>
                    <label htmlFor="admin-visit-interval" className={`${styles.PatientAdminFields__label}`}>{t('admin_visit_interval_days') || 'Intervalo Visitas (Días)'}</label>
                    <Input 
                        id="admin-visit-interval"
                        type="number" 
                        name="visit_interval_days" 
                        value={formData.visit_interval_days || ''} 
                        onChange={updateAdminFields} 
                        placeholder="30"
                        min="0"
                        max="730"
                        step="1"
                        style={{ width: '12ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan3}`}>
                    <label htmlFor="admin-prescription-interval" className={`${styles.PatientAdminFields__label}`}>{t('admin_prescription_interval_days') || 'Intervalo Recetas (Días)'}</label>
                    <Input 
                        id="admin-prescription-interval"
                        type="number" 
                        name="prescription_interval_days" 
                        value={formData.prescription_interval_days || ''} 
                        onChange={updateAdminFields} 
                        placeholder="90"
                        min="0"
                        max="730"
                        step="1"
                        style={{ width: '12ch', flexGrow: 0 }}
                    />
                </div>

                {/* Dates Section */}
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan4}`}>
                    <label htmlFor="admin-next-visit" className={`${styles.PatientAdminFields__label}`}>{t('admin_next_visit') || 'Próx. Visita'}</label>
                    <Input 
                        id="admin-next-visit"
                        type="date" 
                        name="next_suggested_visit_date" 
                        value={formData.next_suggested_visit_date || ''} 
                        onChange={updateAdminFields} 
                        style={{ width: '18ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan4}`}>
                    <label htmlFor="admin-next-prescription" className={`${styles.PatientAdminFields__label}`}>{t('admin_next_prescription') || 'Próx. Receta'}</label>
                    <Input 
                        id="admin-next-prescription"
                        type="date" 
                        name="next_suggested_prescription_date" 
                        value={formData.next_suggested_prescription_date || ''} 
                        onChange={updateAdminFields} 
                        style={{ width: '18ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.PatientAdminFields__group} ${styles.PatientAdminFields__groupSpan4}`}>
                    <label htmlFor="admin-license-expiry" className={`${styles.PatientAdminFields__label}`}>{t('admin_license_expiry') || 'Venc. Carnet'}</label>
                    <Input 
                        id="admin-license-expiry"
                        type="date" 
                        name="license_expiry_date" 
                        value={formData.license_expiry_date || ''} 
                        onChange={updateAdminFields} 
                        style={{ width: '18ch', flexGrow: 0 }}
                    />
                </div>
            </div>
        </article>
    );
};

