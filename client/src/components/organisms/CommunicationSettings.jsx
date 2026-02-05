import React, { useMemo } from 'react';
import AutoTextarea from '../atoms/AutoTextarea';
import ConfigField from '../molecules/ConfigField';

/**
 * CommunicationSettings Organism
 * 
 * Displays communication and messaging template settings
 * Uses BEM CSS methodology and Atomic Design principles
 */

/**
 * Single Responsibility: Get friendly label for variable
 */
const getFriendlyVarLabel = (variable) => {
    const labels = {
        '{patient_name}': 'Paciente',
        '{name}': 'Nombre',
        '{date}': 'Fecha',
        '{time}': 'Hora',
        '{doctor_name}': 'Doctor',
        '{appointment_type}': 'Tipo Turno',
        '{appointment_location}': 'Lugar',
        '{price}': 'Precio',
        '{secretary_name}': 'Secretaria',
        '{link}': 'Enlace'
    };
    return labels[variable] || variable;
};

/**
 * Single Responsibility: Render variable buttons
 */
const renderVariableButtons = (variables, insertVariable, textareaId, settingKey) => {
    return (
        <div className="config-field">
            <p className="config-field__label">Variables disponibles (Haz clic para insertar):</p>
            <div className="variable-buttons">
                {variables.map(v => (
                    <button
                        key={v}
                        type="button"
                        className="variable-button"
                        onClick={() => insertVariable(textareaId, v, settingKey)}
                        title={`Insertar ${v}`}
                    >
                        {getFriendlyVarLabel(v)}
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
    description
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

            {renderVariableButtons(variables, insertVariable, id, settingKey)}

            {(metaTemplateName !== undefined) && (
                <div className="config-grid config-grid--2col" style={{ marginTop: '0.75rem' }}>
                    <ConfigField
                        label="Nombre de Plantilla Meta (API)"
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
                            label="Orden Variables"
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
                    <span className="config-section__icon">📍</span>
                    <h4 className="config-section__title">Dirección del Consultorio</h4>
                </div>

                <div className="config-section__body">
                    <ConfigField
                        id="clinic-address"
                        label="Dirección Física (para turnos Presenciales)"
                        type="text"
                        placeholder="Calle X, Entre Y y Z"
                        value={settings.clinic_address || ''}
                        onChange={(e) => updateSetting('clinic_address', e.target.value)}
                        disabled={!isAdmin}
                        hint="Esta dirección se usará para reemplazar la variable {appointment_location} si el turno es presencial."
                    />
                </div>
            </div>

            {/* Appointment Reminders */}
            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">📅</span>
                    <h4 className="config-section__title">Recordatorios de Turno</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="reminder-template"
                        label="📍 Recordatorio Presencial (General)"
                        value={settings.appointment_reminder_template}
                        settingKey="appointment_reminder_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_reminder_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_reminder_params_order : undefined}
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="reminder-virtual-template"
                        label="🌐 Recordatorio Virtual (Telemedicina)"
                        value={settings.appointment_reminder_virtual_template}
                        settingKey="appointment_reminder_virtual_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                    />
                </div>
            </div>

            {/* Appointment Confirmation */}
            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">✅</span>
                    <h4 className="config-section__title">Confirmación de Turno (Al Crear)</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="confirmation-template"
                        label="📍 Confirmación Presencial (General)"
                        value={settings.appointment_confirmation_template}
                        settingKey="appointment_confirmation_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_confirmation_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_confirmation_params_order : undefined}
                        description="Este mensaje se ofrecerá enviar automáticamente al finalizar la creación de un nuevo turno."
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="confirmation-virtual-template"
                        label="🌐 Confirmación Virtual (Telemedicina)"
                        value={settings.appointment_confirmation_virtual_template}
                        settingKey="appointment_confirmation_virtual_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                    />
                </div>
            </div>

            {/* Public Requests / QR Links */}
            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">🔗</span>
                    <h4 className="config-section__title">Solicitudes Públicas (Links/QR)</h4>
                </div>

                <div className="config-section__body">
                    <TemplateEditor
                        id="whatsapp-prescription-template"
                        label="💊 Solicitud de Receta (WhatsApp)"
                        value={settings.whatsapp_prescription_request_template}
                        settingKey="whatsapp_prescription_request_template"
                        variables={['{patient_name}', '{link}']}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        description="Mensaje que se envía al paciente junto con el link para receta."
                        placeholder="Hola {patient_name}, por favor ingresa al siguiente enlace para solicitar tus recetas: {link}"
                    />

                    <div className="config-section__divider"></div>

                    <TemplateEditor
                        id="whatsapp-patient-data-template"
                        label="👤 Actualización de Datos (WhatsApp)"
                        value={settings.whatsapp_patient_data_request_template}
                        settingKey="whatsapp_patient_data_request_template"
                        variables={['{patient_name}', '{link}']}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        isAdmin={isAdmin}
                        description="Mensaje para que el paciente complete su ficha médica."
                        placeholder="Hola {patient_name}, por favor ingresa al siguiente enlace para completar tus datos: {link}"
                    />
                </div>
            </div>
        </div>
    );
};

export default CommunicationSettings;
