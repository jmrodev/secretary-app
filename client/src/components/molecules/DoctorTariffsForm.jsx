
import React from 'react';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import CurrencyInput from '../atoms/CurrencyInput';

const DoctorTariffsForm = ({ data, settings, onChange, t }) => {
    // Helper to update specific field
    const handleChange = (field, value) => onChange({ ...data, [field]: value });

    return (
        <div className="doctor-tariffs-form space-y-6">
            {settings.enable_office_rentals === 'true' && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-slate-700 uppercase p-0 m-0 text-xs tracking-wider">Configuración de Alquiler</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Nro. de Consultorio">
                            <Input value={data.office_number} onChange={e => handleChange('office_number', e.target.value)} />
                        </FormGroup>
                        <div className="grid grid-cols-2 gap-2">
                            <FormGroup label="Tipo">
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
                            <FormGroup label="Costo">
                                <CurrencyInput className="input-field" value={data.rental_cost} onChange={e => handleChange('rental_cost', e.target.value)} />
                            </FormGroup>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h4 className="font-bold text-slate-700 uppercase p-0 m-0 text-xs tracking-wider mb-4">Precios de Consulta ({data.appointment_duration}m)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormGroup label={t('consultation_price')}>
                        <CurrencyInput className="input-field" value={data.consultation_price} onChange={e => handleChange('consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Consulta Virtual">
                        <CurrencyInput className="input-field" value={data.virtual_consultation_price} onChange={e => handleChange('virtual_consultation_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Recetas">
                        <CurrencyInput className="input-field" value={data.prescription_price} onChange={e => handleChange('prescription_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Licencia Médica">
                        <CurrencyInput className="input-field" value={data.medical_license_price} onChange={e => handleChange('medical_license_price', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Certificados">
                        <CurrencyInput className="input-field" value={data.certificate_price} onChange={e => handleChange('certificate_price', e.target.value)} />
                    </FormGroup>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Especialidad">
                    <Input value={data.specialty} onChange={e => handleChange('specialty', e.target.value)} />
                </FormGroup>
                <FormGroup label="CBU / Alias">
                    <Input value={data.cbu} onChange={e => handleChange('cbu', e.target.value)} />
                </FormGroup>
            </div>
        </div>
    );
};

export default DoctorTariffsForm;
