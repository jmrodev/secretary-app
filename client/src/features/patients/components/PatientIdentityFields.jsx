import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import './PatientIdentityFields.css';

/**
 * PatientIdentityFields Molecule (Sub-Executor).
 * Contains primary identification: name, surname, DNI, insurance, DOB, and affiliate number.
 */
const PatientIdentityFields = ({ formData, handleChange, insurances, t }) => {
    const insuranceOptions = [
        { value: '', label: t('select_choice') || 'Seleccionar...' },
        ...insurances.map(ins => ({ value: ins.id, label: ins.name }))
    ];

    return (
        <div className="patient-identity-fields">
            <div className="patient-identity-fields__row">
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('first_name') || 'Nombre'}</label>
                    <Input
                        name="first_name"
                        className="patient-identity-fields__field"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('last_name') || 'Apellido'}</label>
                    <Input
                        name="last_name"
                        className="patient-identity-fields__field"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="patient-identity-fields__row">
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('dni')}</label>
                    <Input
                        name="dni"
                        className="patient-identity-fields__field"
                        value={formData.dni}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('insurance') || 'Obra Social'}</label>
                    <Select
                        name="insurance_id"
                        className="patient-identity-fields__field"
                        value={formData.insurance_id}
                        options={insuranceOptions}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="patient-identity-fields__row">
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('dob')}</label>
                    <Input
                        type="date"
                        name="dob"
                        className="patient-identity-fields__field"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-identity-fields__group">
                    <label className="patient-identity-fields__label">{t('affiliate_number') || 'Nro Afiliado'}</label>
                    <Input
                        name="affiliate_number"
                        className="patient-identity-fields__field"
                        value={formData.affiliate_number}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientIdentityFields;
