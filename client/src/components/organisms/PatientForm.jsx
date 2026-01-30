import React, { useState } from 'react';
import CurrencyInput from '../atoms/CurrencyInput';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';

const PatientForm = ({
    controller,
    onCancel,
    isEdit = false,
    isAdmin = false
}) => {
    const {
        formData,
        insurances,
        doctors,
        institutions,
        coveredByInstitution,
        isSubmitting,
        t,
        handlers
    } = controller;

    const {
        handleChange,
        handleManualValueChange,
        handleDoctorToggle,
        handlePhoneChange,
        handleInstitutionToggle,
        handleSubmit
    } = handlers;

    return (
        <form onSubmit={handleSubmit} className="patient-form" autoComplete="off">
            {/* Fake fields to stop Chrome Autosave */}
            <div className="visually-hidden">
                <input type="text" name="fake_user_trap" autoComplete="username" tabIndex={-1} />
                <input type="password" name="fake_pass_trap" autoComplete="new-password" tabIndex={-1} />
            </div>

            {!isEdit && (
                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            data-lpignore="true"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            data-lpignore="true"
                        />
                    </div>
                </div>
            )}

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">{t('first_name') || 'Nombre'}</label>
                    <input
                        name="first_name"
                        className="input-field"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('last_name') || 'Apellido'}</label>
                    <input
                        name="last_name"
                        className="input-field"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">{t('dni')}</label>
                    <input
                        name="dni"
                        className="input-field"
                        value={formData.dni}
                        onChange={handleChange}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('insurance') || 'Obra Social'}</label>
                    <select
                        name="insurance_id"
                        className="input-field"
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

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="input-field"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="section-divider">
                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={coveredByInstitution}
                        onChange={(e) => handleInstitutionToggle(e.target.checked)}
                        id="pf_institution"
                    />
                    <label htmlFor="pf_institution" className="checkbox-label">
                        {t('covered_by_institution_prompt') || '¿Cubierto por una Institución? (Municipio, Hospital, etc.)'}
                    </label>
                </div>

                {coveredByInstitution && (
                    <div className="input-group">
                        <label className="input-label">{t('paying_institution') || 'Institución Pagadora'}</label>
                        <select
                            name="institution_id"
                            className="input-field"
                            value={formData.institution_id}
                            onChange={handleChange}
                        >
                            <option value="">{t('select_institution') || 'Seleccionar Institución...'}</option>
                            {institutions.filter(i => i.status === 'active').map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Multiple Phone Numbers Section */}
            <div className="section-divider">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={handlePhoneChange}
                />
            </div>

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">{t('dob')}</label>
                    <input
                        type="date"
                        name="dob"
                        className="input-field"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('affiliate_number') || 'Nro Afiliado'}</label>
                    <input
                        name="affiliate_number"
                        className="input-field"
                        value={formData.affiliate_number}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="input-group">
                <label className="input-label">{t('address')}</label>
                <input
                    name="address"
                    className="input-field"
                    value={formData.address}
                    onChange={handleChange}
                />
            </div>

            <div className="input-group">
                <label className="input-label">{t('medical_history')}</label>
                <textarea
                    name="medical_history"
                    className="input-field"
                    rows="3"
                    value={formData.medical_history}
                    onChange={handleChange}
                />
            </div>

            {isAdmin && (
                <div className="admin-section">
                    <h4 className="section-title">{t('admin_settings') || 'Administrative Settings'}</h4>

                    <div className="input-group mb-4">
                        <label className="input-label">{t('assigned_doctors')}</label>
                        <div className="doctor-selection-grid">
                            {doctors.map(doc => (
                                <label key={doc.id} className="doctor-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.assignedDoctors?.includes(doc.id)}
                                        onChange={() => handleDoctorToggle(doc.id)}
                                    />
                                    Dr. {doc.full_name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">{t('tariff_adjustment') || 'Tariff Adjustment (%)'}</label>
                            <input
                                type="number"
                                name="tariff_percent"
                                className="input-field"
                                value={formData.tariff_percent}
                                onChange={handleChange}
                                placeholder="e.g. 10"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('tariff_override') || 'Tariff Override ($)'}</label>
                            <CurrencyInput
                                className="input-field"
                                value={formData.tariff_override}
                                onChange={(e) => handleManualValueChange('tariff_override', e.target.value)}
                                placeholder="e.g. 5000"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">{t('visit_interval_days')}</label>
                            <input type="number" name="visit_interval_days" className="input-field" value={formData.visit_interval_days} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('prescription_interval_days')}</label>
                            <input type="number" name="prescription_interval_days" className="input-field" value={formData.prescription_interval_days} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row-3">
                        <div className="input-group">
                            <label className="input-label">{t('next_suggested_visit')}</label>
                            <input type="date" name="next_suggested_visit_date" className="input-field" value={formData.next_suggested_visit_date} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('next_suggested_prescription')}</label>
                            <input type="date" name="next_suggested_prescription_date" className="input-field" value={formData.next_suggested_prescription_date} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('license_expiry')}</label>
                            <input type="date" name="license_expiry_date" className="input-field" value={formData.license_expiry_date} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            )}

            <div className="form-actions">
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        {t('cancel')}
                    </button>
                )}
                <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={isSubmitting}>
                    {isEdit ? t('save_changes') : t('create_account')}
                </button>
            </div>
        </form >
    );
};

export default PatientForm;
