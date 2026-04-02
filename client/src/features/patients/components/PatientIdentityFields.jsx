
import React from 'react';

/**
 * PatientIdentityFields Molecule (Sub-Executor).
 * Contains primary identification: name, surname, DNI, insurance, DOB, and affiliate number.
 */
const PatientIdentityFields = ({ formData, handleChange, insurances, t }) => {
    return (
        <>
            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('first_name') || 'Nombre'}</label>
                    <input
                        name="first_name"
                        className="patient-form__field"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('last_name') || 'Apellido'}</label>
                    <input
                        name="last_name"
                        className="patient-form__field"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('dni')}</label>
                    <input
                        name="dni"
                        className="patient-form__field"
                        value={formData.dni}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('insurance') || 'Obra Social'}</label>
                    <select
                        name="insurance_id"
                        className="patient-form__field"
                        value={formData.insurance_id}
                        onChange={handleChange}
                    >
                        <option value="">{t('select_choice') || 'Seleccionar...'}</option>
                        {insurances.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('dob')}</label>
                    <input
                        type="date"
                        name="dob"
                        className="patient-form__field"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('affiliate_number') || 'Nro Afiliado'}</label>
                    <input
                        name="affiliate_number"
                        className="patient-form__field"
                        value={formData.affiliate_number}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </>
    );
};

export default PatientIdentityFields;
