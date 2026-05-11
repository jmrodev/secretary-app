import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import './PatientInsuranceFields.css';

/**
 * PatientInsuranceFields Molecule (Sub-Executor).
 * Handles insurance selection and affiliate number.
 * Optimized for Bento Box layout.
 */
const PatientInsuranceFields = ({ formData, handleChange, insurances, t }) => {
    const selectedInsurance = insurances.find(i => i.id === parseInt(formData.insurance_id));

    return (
        <article className="patient-insurance-fields">
            <header className="patient-insurance-fields__header">
                <Icon name="verified_user" size="1.25rem" />
                <h3 className="patient-insurance-fields__title">{t('health_coverage')}</h3>
            </header>

            <div className="patient-insurance-fields__bento">
                <div className="patient-insurance-fields__group patient-insurance-fields__group--span-7">
                    <label className="patient-insurance-fields__label">{t('insurance_entities')}</label>
                    <select
                        name="insurance_id"
                        className="patient-insurance-fields__select"
                        value={formData.insurance_id || ''}
                        onChange={handleChange}
                    >
                        <option value="">{t('particular')}</option>
                        {insurances.map(insurance => (
                            <option key={insurance.id} value={insurance.id}>
                                {insurance.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="patient-insurance-fields__group patient-insurance-fields__group--span-5">
                    <label className="patient-insurance-fields__label">{t('affiliate_number')}</label>
                    <Input
                        name="affiliate_number"
                        className="patient-insurance-fields__field"
                        value={formData.affiliate_number || ''}
                        onChange={handleChange}
                        placeholder="Ej: 123456789/00"
                    />
                </div>
            </div>

            {formData.insurance_id && (
                <div className="patient-insurance-fields__status-card">
                    <div className="patient-insurance-fields__status-info">
                        <Icon name="info" size="1.1rem" />
                        <div>
                            <span className="patient-insurance-fields__status-label">{t('coverage_active')}</span>
                            <p className="patient-insurance-fields__status-detail">
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
