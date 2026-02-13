import React from 'react';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import CurrencyInput from '../atoms/CurrencyInput';
import './DoctorTariffsForm.css';

const DoctorTariffsForm = ({ data, settings, onChange, t }) => {
    // Helper to update specific field
    const handleChange = (field, value) => onChange({ ...data, [field]: value });

    return (
        <div className="doctor-tariffs-form">
            {settings.enable_office_rentals === 'true' && (
                <div className="doctor-tariffs-form__section doctor-tariffs-form__section--rental">
                    <h4 className="doctor-tariffs-form__title">{t('rental_configuration') || 'Configuración de Alquiler'}</h4>
                    <div className="doctor-tariffs-form__grid">
                        <FormGroup label={t('office_number')}>
                            <Input value={data.office_number} onChange={e => handleChange('office_number', e.target.value)} />
                        </FormGroup>
                        <div className="doctor-tariffs-form__nested-grid">
                            <FormGroup label={t('type')}>
                                <Select
                                    value={data.rental_type}
                                    onChange={e => handleChange('rental_type', e.target.value)}
                                    options={[
                                        { value: 'hourly', label: t('hourly') },
                                        { value: 'daily', label: t('daily') },
                                        { value: 'weekly', label: t('weekly') },
                                        { value: 'monthly', label: t('monthly') }
                                    ]}
                                />
                            </FormGroup>
                            <FormGroup label={t('cost')}>
                                <CurrencyInput className="input-field" value={data.rental_cost} onChange={e => handleChange('rental_cost', e.target.value)} />
                            </FormGroup>
                        </div>
                    </div>
                </div>
            )}

            <div className="doctor-tariffs-form__section">
                <h4 className="doctor-tariffs-form__title">
                    {t('consultation_prices') || 'Precios de Consulta'} ({data.appointment_duration}m)
                </h4>
                <div className="doctor-tariffs-form__grid doctor-tariffs-form__grid--3col">
                    <FormGroup label={t('consultation_price')}>
                        <CurrencyInput className="input-field" value={data.consultation_price} onChange={e => handleChange('consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('virtual_consultation_price') || 'Consulta Virtual'}>
                        <CurrencyInput className="input-field" value={data.virtual_consultation_price} onChange={e => handleChange('virtual_consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('prescription_price') || 'Recetas'}>
                        <CurrencyInput className="input-field" value={data.prescription_price} onChange={e => handleChange('prescription_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('medical_license_price') || 'Licencia Médica'}>
                        <CurrencyInput className="input-field" value={data.medical_license_price} onChange={e => handleChange('medical_license_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label={t('certificate_price') || 'Certificados'}>
                        <CurrencyInput className="input-field" value={data.certificate_price} onChange={e => handleChange('certificate_price', e.target.value)} />
                    </FormGroup>
                </div>
            </div>

            <div className="doctor-tariffs-form__grid">
                <FormGroup label={t('specialty')}>
                    <Input value={data.specialty} onChange={e => handleChange('specialty', e.target.value)} />
                </FormGroup>
                <FormGroup label={t('cbu_label')}>
                    <Input value={data.cbu || ''} onChange={(e) => handleChange('cbu', e.target.value)} placeholder="28500..." />
                </FormGroup>
                <FormGroup label={t('alias_label')}>
                    <Input value={data.alias || ''} onChange={(e) => handleChange('alias', e.target.value)} placeholder="mi.alias.pago" />
                </FormGroup>
                <FormGroup label={t('professional_bio') || 'Bio Profesional'}>
                    <textarea
                        className="input-field doctor-tariffs-form__bio-field"
                        value={data.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Breve currículum o información relevante..."
                    />
                </FormGroup>
            </div>
        </div>
    );
};

export default DoctorTariffsForm;
