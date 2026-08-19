import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Icon } from '@/components/atoms/Icon';
import styles from './PatientInsuranceFields.module.css';

/**
 * PatientInsuranceFields Molecule (Sub-Executor).
 * Handles insurance selection and affiliate number.
 * Optimized for Bento Box layout.
 */
export const PatientInsuranceFields = ({ formData, updatePatientData, insurances, t }) => {
    const selectedInsurance = insurances.find(i => i.id === parseInt(formData.insurance_id));

    return (
        <article className={`${styles.PatientInsuranceFields__root}`}>
            

            <div className={`${styles.PatientInsuranceFields__bento}`}>
                <div className={`${styles.PatientInsuranceFields__group} ${styles.PatientInsuranceFields__groupSpan7}`}>
                    <label htmlFor="patient-insurance" className={`${styles.PatientInsuranceFields__label}`}>{t('os_prepaga') || 'OS / Prepaga'}</label>
                    <Select
                        id="patient-insurance"
                        name="insurance_id"
                        value={formData.insurance_id || ''}
                        onChange={updatePatientData}
                        options={[
                            { value: '', label: t('particular') },
                            ...insurances.map(insurance => ({
                                value: insurance.id,
                                label: insurance.name
                            }))
                        ]}
                    />
                </div>

                <div className={`${styles.PatientInsuranceFields__group} ${styles.PatientInsuranceFields__groupSpan5}`}>
                    <label htmlFor="patient-affiliate-number" className={`${styles.PatientInsuranceFields__label}`}>{t('affiliate_number')}</label>
                    <Input
                        id="patient-affiliate-number"
                        name="affiliate_number"
                        className="patient-insurance-fields__field"
                        value={formData.affiliate_number || ''}
                        onChange={updatePatientData}
                        placeholder="Ej: 123456789/00"
                    />
                </div>
            </div>

            {formData.insurance_id && (
                <div className={`${styles.PatientInsuranceFields__statusCard}`}>
                    <div className={`${styles.PatientInsuranceFields__statusInfo}`}>
                        <Icon name="info" size="1.1rem" />
                        <div>
                            <span className={`${styles.PatientInsuranceFields__statusLabel}`}>{t('coverage_active')}</span>
                            <p className={`${styles.PatientInsuranceFields__statusDetail}`}>
                                {selectedInsurance?.name} - {t('requires_order_verification')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

