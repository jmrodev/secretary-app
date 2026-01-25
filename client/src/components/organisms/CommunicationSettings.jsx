import React, { useMemo } from 'react';
import AutoTextarea from '../atoms/AutoTextarea';

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

    const getFriendlyVarLabel = (v) => {
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
        return labels[v] || v;
    };

    return (
        <div className="input-group">
            <label className="input-label" htmlFor={id}>{label}</label>
            <AutoTextarea
                id={id}
                className="input-field min-h-[160px]"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
                disabled={!isAdmin}
            />
            <div className="mt-3 w-full">
                <p className="text-xs font-semibold text-main-600 mb-2">Variables disponibles (Haz clic para insertar):</p>
                <div className="flex flex-wrap gap-2 w-full">
                    {variables.map(v => (
                        <button
                            key={v}
                            type="button"
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            onClick={() => insertVariable(id, v, settingKey)}
                            title={`Insertar ${v}`}
                        >
                            {getFriendlyVarLabel(v)}
                        </button>
                    ))}
                </div>
            </div>

            {(metaTemplateName !== undefined) && (
                <>
                    <div className="mt-2 text-right">
                        <label className="text-xs text-main-600 font-bold mr-2">Nombre de Plantilla Meta (API):</label>
                        <input
                            type="text"
                            className="input-field text-xs inline-block w-48 py-1"
                            placeholder="ej: reminder_template"
                            value={metaTemplateName || ''}
                            onChange={(e) => updateSetting(settingKey === 'appointment_reminder_template' ? 'meta_reminder_template_name' : 'meta_confirmation_template_name', e.target.value)}
                        />
                    </div>
                    {metaParamsOrder !== undefined && (
                        <div className="mt-1 text-right">
                            <label className="text-xs text-main-600 font-bold mr-2">Orden Variables:</label>
                            <input
                                type="text"
                                className="input-field text-xs inline-block w-48 py-1"
                                placeholder="{patient_name}, {date}..."
                                value={metaParamsOrder || ''}
                                onChange={(e) => updateSetting(settingKey === 'appointment_reminder_template' ? 'meta_reminder_params_order' : 'meta_confirmation_params_order', e.target.value)}
                            />
                        </div>
                    )}
                </>
            )}

            {description && (
                <p className="text-xs text-muted mt-1 italic">{description}</p>
            )}
        </div>
    );
};


const CommunicationSettings = ({ user, settings, updateSetting, insertVariable }) => {
    const isAdmin = user.role === 'admin' || user.role === 'secretary';
    const commonVars = useMemo(() => ['{patient_name}', '{date}', '{time}', '{doctor_name}', '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}'], []);

    return (
        <div className="tab-panel animate-in w-full overflow-hidden">
            <div className="card mb-8 w-full max-w-full">
                <h3 className="config-section-title">💬 Mensajería y Plantillas</h3>
                <p className="text-muted mb-6">Personalice los mensajes que se envían por WhatsApp.</p>

                <div className="flex flex-col gap-8 w-full">
                    {/* Clinic Address */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📍</span>
                            <h4 className="font-bold text-main-800">Dirección del Consultorio</h4>
                        </div>
                        <div className="input-group">
                            <label className="input-label" htmlFor="clinic-address">Dirección Física (para turnos Presenciales)</label>
                            <input
                                id="clinic-address"
                                type="text"
                                className="input-field"
                                placeholder="Calle X, Entre Y y Z"
                                value={settings.clinic_address || ''}
                                onChange={(e) => updateSetting('clinic_address', e.target.value)}
                                disabled={!isAdmin}
                            />
                            <p className="text-xs text-muted mt-1 italic">
                                Esta dirección se usará para reemplazar la variable <b>{'{appointment_location}'}</b> si el turno es presencial.
                            </p>
                        </div>
                    </div>

                    {/* Appt Reminders */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📅</span>
                            <h4 className="font-bold text-main-800">Recordatorios de Turno</h4>
                        </div>
                        <div className="flex flex-col gap-8">
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

                    {/* Appt Confirmation */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">✅</span>
                            <h4 className="font-bold text-main-800">Confirmación de Turno (Al Crear)</h4>
                        </div>
                        <div className="flex flex-col gap-8">
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
                </div>
            </div>
        </div>
    );
};

export default CommunicationSettings;
