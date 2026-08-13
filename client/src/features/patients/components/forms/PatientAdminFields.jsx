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
            

            <div className={`${styles.bento}`}>
                {/* Compact Doctor Section */}
                <section className={`${styles.section} ${styles.groupSpan12}`}>
                    <header className={`${styles.miniHeader}`}>
                        <Icon name="medical_services" size="1.1rem" />
                        <h4 className={`${styles.miniTitle}`}>Médicos Asignados</h4>
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
                <div className={`${styles.group} ${styles.groupSpan3}`}>
                    <label className={`${styles.label}`}>Ajuste Tarifa (%)</label>
                    <Input
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
                <div className={`${styles.group} ${styles.groupSpan3}`}>
                    <label className={`${styles.label}`}>Tarifa Fija</label>
                    <CurrencyInput
                        value={formData.tariff_override || ''}
                        onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                        placeholder="$ 5000"
                        style={{ width: '16ch', flexGrow: 0 }}
                    />
                </div>

                {/* Intervals Section */}
                <div className={`${styles.group} ${styles.groupSpan3}`}>
                    <label className={`${styles.label}`}>Intervalo Visitas (Días)</label>
                    <Input 
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
                <div className={`${styles.group} ${styles.groupSpan3}`}>
                    <label className={`${styles.label}`}>Intervalo Recetas (Días)</label>
                    <Input 
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
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>Próx. Visita</label>
                    <Input 
                        type="date" 
                        name="next_suggested_visit_date" 
                        value={formData.next_suggested_visit_date || ''} 
                        onChange={updateAdminFields} 
                        style={{ width: '18ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>Próx. Receta</label>
                    <Input 
                        type="date" 
                        name="next_suggested_prescription_date" 
                        value={formData.next_suggested_prescription_date || ''} 
                        onChange={updateAdminFields} 
                        style={{ width: '18ch', flexGrow: 0 }}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>Venc. Carnet</label>
                    <Input 
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

export default PatientAdminFields;
