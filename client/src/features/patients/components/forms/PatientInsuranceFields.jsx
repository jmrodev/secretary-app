import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import styles from './PatientInsuranceFields.module.css';

/**
 * PatientInsuranceFields Molecule (Sub-Executor).
 * Handles insurance selection and affiliate number.
 * Optimized for Bento Box layout.
 */
const PatientInsuranceFields = ({ formData, updatePatientData, insurances, t }) => {
    const selectedInsurance = insurances.find(i => i.id === parseInt(formData.insurance_id));

    return (
        <article className={`${styles.root}`}>
            

            <div className={`${styles.bento}`}>
                <div className={`${styles.group} ${styles.groupSpan7}`}>
                    <label className={`${styles.label}`}>OS / Prepaga</label>
                    <Select
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

                <div className={`${styles.group} ${styles.groupSpan5}`}>
                    <label className={`${styles.label}`}>{t('affiliate_number')}</label>
                    <Input
                        name="affiliate_number"
                        className="patient-insurance-fields__field"
                        value={formData.affiliate_number || ''}
                        onChange={updatePatientData}
                        placeholder="Ej: 123456789/00"
                    />
                </div>
            </div>

            {formData.insurance_id && (
                <div className={`${styles.statusCard}`}>
                    <div className={`${styles.statusInfo}`}>
                        <Icon name="info" size="1.1rem" />
                        <div>
                            <span className={`${styles.statusLabel}`}>{t('coverage_active')}</span>
                            <p className={`${styles.statusDetail}`}>
                                {selectedInsurance?.name} - {t('requires_order_verification')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default PatientInsuranceFields;
