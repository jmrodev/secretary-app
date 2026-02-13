import React, { useMemo } from 'react';
import AutoTextarea from '../atoms/AutoTextarea';
import ConfigField from '../molecules/ConfigField';
import Icon from '../atoms/Icon';
import { useLanguage } from '../../context/LanguageContext';

/**
 * CommunicationSettings Organism
 * 
 * Displays communication and messaging template settings
 * Uses BEM CSS methodology and Atomic Design principles
 */

/**
 * Single Responsibility: Get friendly label for variable
 */
const getFriendlyVarLabel = (variable, t) => {
    const labels = {
        '{patient_name}': t('patient_var'),
        '{name}': t('name_var'),
        '{date}': t('date_var'),
        '{time}': t('time_var'),
        '{doctor_name}': t('doctor_var'),
        '{appointment_type}': t('appointment_type_var'),
        '{appointment_location}': t('location_var'),
        '{price}': t('price_var'),
        '{secretary_name}': t('secretary_var'),
        '{link}': t('link_var')
    };
    return labels[variable] || variable;
};

/**
 * Single Responsibility: Render variable buttons
 */
const renderVariableButtons = (variables, insertVariable, textareaId, settingKey, t) => {
    return (
        <div className="config-field">
            <p className="config-field__label">{t('available_variables')}</p>
            <div className="variable-buttons">
                {variables.map(v => (
                    <button
                        key={v}
                        type="button"
                        className="variable-button"
                        onClick={() => insertVariable(textareaId, v, settingKey)}
                        title={t('insert_variable_title').replace('{variable}', v)}
                    >
                        {getFriendlyVarLabel(v, t)}
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * TemplateEditor Component
 * 
 * Single Responsibility: Render a message template editor with variables
 */
const TemplateEditor = ({
    id,
    label,
    value,
    settingKey,
    placeholder,
    variables = [],
    updateSetting,
    insertVariable,
    isAdmin,
    metaTemplateName,
    metaParamsOrder,
    description,
    t
}) => {
    return (
        <div className="config-field">
            <label className="config-field__label" htmlFor={id}>{label}</label>
            <AutoTextarea
                id={id}
                className="input-field min-h-[160px]"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
                disabled={!isAdmin}
            />

            {renderVariableButtons(variables, insertVariable, id, settingKey, t)}

            {(metaTemplateName !== undefined) && (
                <div className="config-grid config-grid--2col" style={{ marginTop: '0.75rem' }}>
                    <ConfigField
                        label={t('meta_template_name')}
                        type="text"
                        placeholder="ej: reminder_template"
                        value={metaTemplateName || ''}
                        onChange={(e) => updateSetting(
                            settingKey === 'appointment_reminder_template'
                                ? 'meta_reminder_template_name'
                                : 'meta_confirmation_template_name',
                            e.target.value
                        )}
                    />
                    {metaParamsOrder !== undefined && (
                        <ConfigField
                            label={t('variable_order')}
                            type="text"
                            placeholder="{patient_name}, {date}..."
                            value={metaParamsOrder || ''}
                            onChange={(e) => updateSetting(
                                settingKey === 'appointment_reminder_template'
                                    ? 'meta_reminder_params_order'
                                    : 'meta_confirmation_params_order',
                                e.target.value
                            )}
                        />
                    )}
                </div>
            )}

            {description && (
                <span className="config-field__hint">{description}</span>
            )}
        </div>
    );
};

const CommunicationSettings = ({ user, settings, updateSetting, insertVariable }) => {
    const { t } = useLanguage();
    const isAdmin = user.role === 'admin' || user.role === 'secretary';
    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}'
    ], []);

    return (
        <div className="tab-panel animate-fadeIn">
            {/* Clinic Address */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="CONFIG" size="1.2rem" className="mr-2" />
                    <h4 className="config-section__title">{t('clinic_address_title')}</h4>
                </div>

                <div className="config-section__body">
                    <ConfigField
                        id="clinic-address"
                        label={t('physical_address_label')}
                        type="text"
                        placeholder="Calle X, Entre Y y Z"
                        value={settings.clinic_address || ''}
                        onChange={(e) => updateSetting('clinic_address', e.target.value)}
                        disabled={!isAdmin}
                        hint={t('physical_address_hint')}
                    />
                </div>
            </div>

            {/* Appointment Reminders */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="APPOINTMENTS" size="1.2rem" className="mr-2" />
                    <h4 className="config-section__title">{t('appointment_reminders_title')}</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="reminder-template"
                        label={<span className="flex items-center gap-1"><Icon name="HISTORY" size="1rem" /> {t('presential_reminder_label')}</span>}
                        value={settings.appointment_reminder_template}
                        settingKey="appointment_reminder_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_reminder_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_reminder_params_order : undefined}
                        t={t}
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="reminder-virtual-template"
                        label={<span className="flex items-center gap-1"><Icon name="VIRTUAL" size="1rem" /> {t('virtual_reminder_label')}</span>}
                        value={settings.appointment_reminder_virtual_template}
                        settingKey="appointment_reminder_virtual_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        t={t}
                    />
                </div>
            </div>

            {/* Appointment Confirmation */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="CHECK" size="1.2rem" className="mr-2" />
                    <h4 className="config-section__title">{t('appointment_confirmation_title')}</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="confirmation-template"
                        label={<span className="flex items-center gap-1"><Icon name="CHECK" size="1rem" /> {t('presential_confirmation_label')}</span>}
                        value={settings.appointment_confirmation_template}
                        settingKey="appointment_confirmation_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_confirmation_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_confirmation_params_order : undefined}
                        description={t('confirmation_message_hint')}
                        t={t}
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="confirmation-virtual-template"
                        label={<span className="flex items-center gap-1"><Icon name="VIRTUAL" size="1rem" /> {t('virtual_confirmation_label')}</span>}
                        value={settings.appointment_confirmation_virtual_template}
                        settingKey="appointment_confirmation_virtual_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        t={t}
                    />
                </div>
            </div>

            {/* Public Requests / QR Links */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="DOCUMENTS" size="1.2rem" className="mr-2" />
                    <h4 className="config-section__title">{t('public_requests_title')}</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="whatsapp-prescription-template"
                        label={<span className="flex items-center gap-1"><Icon name="PRESCRIPTION" size="1rem" /> {t('prescription_request_whatsapp')}</span>}
                        value={settings.whatsapp_prescription_request_template}
                        settingKey="whatsapp_prescription_request_template"
                        variables={['{patient_name}', '{link}']}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        description={t('prescription_request_hint')}
                        placeholder={t('placeholder_prescription_req')}
                        t={t}
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="whatsapp-patient-data-template"
                        label={<span className="flex items-center gap-1"><Icon name="PROFILE" size="1rem" /> {t('data_update_whatsapp')}</span>}
                        value={settings.whatsapp_patient_data_request_template}
                        settingKey="whatsapp_patient_data_request_template"
                        variables={['{patient_name}', '{link}']}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        description={t('data_update_hint')}
                        placeholder={t('placeholder_data_req')}
                        t={t}
                    />
                </div>
            </div>
        </div>
    );
};

export default CommunicationSettings;
