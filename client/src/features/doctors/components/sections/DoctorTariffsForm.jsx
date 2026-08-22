import React from 'react';
import { FormGroup } from '@/components/molecules/FormGroup';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { AutoTextarea } from '@/components/atoms/AutoTextarea';
import styles from './DoctorTariffsForm.module.css';

export const DoctorTariffsForm = ({ data, settings, onChange, t }) => {
    // Helper to update specific field
    const handleTariffChange = (field, value) => onChange({ ...data, [field]: value });

    return (
        <div className={`${styles.DoctorTariffsForm__root}`}>
            {settings.enable_office_rentals === 'true' && (
                <div className={`${styles.DoctorTariffsForm__section} ${styles.DoctorTariffsForm__sectionRental}`}>
                    <h4 className={`${styles.DoctorTariffsForm__title}`}>{t('rental_configuration')}</h4>
                    <div className={`${styles.DoctorTariffsForm__grid}`}>
                        <FormGroup label={t('office_number')}>
                            <Input value={data.office_number} onChange={e => handleTariffChange('office_number', e.target.value)} />
                        </FormGroup>
                        <div className={`${styles.DoctorTariffsForm__nestedGrid}`}>
                            <FormGroup label={t('type')}>
                                <Select
                                    value={data.rental_type}
                                    onChange={e => handleTariffChange('rental_type', e.target.value)}
                                    options={[
                                        { value: 'hourly', label: t('hourly') },
                                        { value: 'daily', label: t('daily') },
                                        { value: 'weekly', label: t('weekly') },
                                        { value: 'monthly', label: t('monthly') }
                                    ]}
                                />
                            </FormGroup>
                            <FormGroup label={t('cost')}>
                                <CurrencyInput value={data.rental_cost} onChange={e => handleTariffChange('rental_cost', e.target.value)} />
                            </FormGroup>
                        </div>
                    </div>
                </div>
            )}

            <div className={`${styles.DoctorTariffsForm__section}`}>
                <h4 className={`${styles.DoctorTariffsForm__title}`}>
                    {t('consultation_prices')} ({data.appointment_duration}m)
                </h4>
                 <div className={`${styles.DoctorTariffsForm__grid} ${styles.DoctorTariffsForm__grid3col}`}>
                    <FormGroup label={t('consultation_price')}>
                        <CurrencyInput value={data.consultation_price} onChange={e => handleTariffChange('consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('virtual_consultation_price')}>
                        <CurrencyInput value={data.virtual_consultation_price} onChange={e => handleTariffChange('virtual_consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('prescription_price')}>
                        <CurrencyInput value={data.prescription_price} onChange={e => handleTariffChange('prescription_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('medical_license_price')}>
                        <CurrencyInput value={data.medical_license_price} onChange={e => handleTariffChange('medical_license_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('certificate_price')}>
                        <CurrencyInput value={data.certificate_price} onChange={e => handleTariffChange('certificate_price', e.target.value)} />
                    </FormGroup>
                </div>
            </div>

            <div className={`${styles.DoctorTariffsForm__grid}`}>
                <FormGroup label={t('specialty')}>
                    <Input value={data.specialty} onChange={e => handleTariffChange('specialty', e.target.value)} />
                </FormGroup>
                <FormGroup label={t('cbu_label')}>
                    <Input value={data.cbu || ''} onChange={(e) => handleTariffChange('cbu', e.target.value)} placeholder="28500..." />
                </FormGroup>
                <FormGroup label={t('alias_label')}>
                    <Input value={data.alias || ''} onChange={(e) => handleTariffChange('alias', e.target.value)} placeholder={t('alias_placeholder_example')} />
                </FormGroup>
                <FormGroup label={t('professional_bio')}>
                    <AutoTextarea
                        className={`${styles.DoctorTariffsForm__bioField}`}
                        value={data.bio || ''}
                        onChange={(e) => handleTariffChange('bio', e.target.value)}
                        placeholder={t('bio_placeholder_example')}
                    />
                </FormGroup>
            </div>
        </div>
    );
};


