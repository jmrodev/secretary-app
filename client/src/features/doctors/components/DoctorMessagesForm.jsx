import React, { useMemo, useState } from 'react';
import MessageTemplateEditor from '@/features/config/components/MessageTemplateEditor';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import './DoctorMessagesForm.css';

/**
 * DoctorMessagesForm Molecule
 * 
 * Allows a doctor to customize their specific message templates and AI context.
 */
const DoctorMessagesForm = ({ data, onChange, settings, t }) => {
    const [activeSubTab, setActiveSubTab] = useState('templates'); // 'templates', 'confirmation', 'ai'

    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}',
        '{cbu}', '{alias}', '{bio}', '{horarios}', '{feriados}'
    ], []);

    const BUSINESS_RULES_BASE = `
# Identidad y Propósito
Sos "Gemi", la asistente virtual del consultorio de {doctor_name}. Tu misión es ayudar a la secretaria {secretary_name} a responder dudas de forma rápida y amable.

# Información Crítica (Variables Automáticas)
- Mi Doctor/a: {doctor_name}
- Especialidad e Info: {bio}
- Mis Horarios de Atención: {horarios}
- Días sin atención/Feriados: {feriados}
- Ubicación: {appointment_location}
- Valor de Consulta: {price}
- Datos de Pago (CBU/Alias): {cbu} / {alias}

# Reglas de Atención y Cobro
1. DEUDAS: Solo informar o reclamar pagos por turnos PASADOS o del DÍA. Los turnos futuros no generan deuda todavía.
2. OBRAS SOCIALES: Si el paciente tiene co-pago, solo cobramos su parte; el resto lo gestionamos con la institución.
3. RECETAS/ÓRDENES: Tienen una demora de entrega de 48hs hábiles.
4. TURNOS: Las cancelaciones deben avisarse con al menos 24hs de anticipación.
5. NOVEDADES: Si el paciente pregunta algo que no sabés, pedile que aguarde a que {secretary_name} se libere para responderle.

# Estilo de Comunicación
- Hablá en español rioplatense (usá "vos", "tenés", "estás") de forma educada.
- Sé extremadamente breve (máximo 25 palabras por respuesta).
- Usá emojis de forma moderada para ser amable (ej: 🩺, 📅, ✅).
- En el primer contacto del día, presentate como Gemi.
`.trim();

    const defaultTemplates = {
        reminder_template: settings?.appointment_reminder_template || "Hola {patient_name}, te recordamos que tenés un turno con el/la Dr/a. {doctor_name} el día {date} a las {time} hs en {appointment_location}. Valor de la consulta: {price}. Si no podés asistir, por favor avisanos con 24hs de anticipación.",
        reminder_virtual_template: settings?.appointment_reminder_virtual_template || "Hola {patient_name}, te recordamos tu consulta virtual con el/la Dr/a. {doctor_name} el día {date} a las {time} hs. El enlace de la videollamada te llegará 10 minutos antes. Valor de la consulta: {price}.",
        confirmation_template: settings?.appointment_confirmation_template || "Hola {patient_name}, confirmamos tu turno con el/la Dr/a. {doctor_name} para el día {date} a las {time} hs en {appointment_location}. ¡Te esperamos!",
        confirmation_virtual_template: settings?.appointment_confirmation_virtual_template || "Hola {patient_name}, confirmamos tu turno virtual con el/la Dr/a. {doctor_name} para el día {date} a las {time} hs. Recibirás el link de conexión antes de la consulta."
    };

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleAutoFill = () => {
        const newData = { ...data };
        let changed = false;
        
        // Templates
        Object.keys(defaultTemplates).forEach(key => {
            if (!newData[key]) {
                newData[key] = defaultTemplates[key];
                changed = true;
            }
        });

        // AI Rules Base
        if (!newData.gemini_context) {
            newData.gemini_context = BUSINESS_RULES_BASE;
            changed = true;
        }

        if (changed) onChange(newData);
    };

    const insertVariable = (id, variable, field) => {
        const textarea = document.getElementById(id);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = data[field] || '';
        const before = text.substring(0, start);
        const after = text.substring(end);

        updateField(field, before + variable + after);

        // Return focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    return (
        <div className="doctor-messages-form">
            <header className="doctor-messages-form__header">
                <div className="doctor-messages-form__header-content">
                    <div className="doctor-messages-form__title-wrapper">
                        <Icon name="CHAT" size="1.2rem" />
                        <h3 className="doctor-messages-form__title">{t('doctor_messages_config') || 'Configuración de Mensajes'}</h3>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAutoFill}
                        title="Completar vacíos con reglas de negocio y plantillas"
                        className="doctor-messages-form__autofill-btn"
                    >
                        <Icon name="SYNC" size="1rem" />
                        {t('load_base_rules') || 'Cargar Reglas Base'}
                    </Button>
                </div>
            </header>

            <TabNav className="doctor-messages-form__subtabs">
                <TabButton 
                    isActive={activeSubTab === 'templates'} 
                    onClick={() => setActiveSubTab('templates')}
                    size="sm"
                >
                    <Icon name="APPOINTMENTS" size="0.9rem" className="mr-1" />
                    {t('reminders_tab') || 'Recordatorios'}
                </TabButton>
                <TabButton 
                    isActive={activeSubTab === 'confirmation'} 
                    onClick={() => setActiveSubTab('confirmation')}
                    size="sm"
                >
                    <Icon name="CHECK" size="0.9rem" className="mr-1" />
                    {t('confirmations_tab') || 'Confirmaciones'}
                </TabButton>
                <TabButton 
                    isActive={activeSubTab === 'ai'} 
                    onClick={() => setActiveSubTab('ai')}
                    size="sm"
                >
                    <Icon name="NEW" size="0.9rem" className="mr-1" />
                    {t('ai_tab') || 'IA Gemini'}
                </TabButton>
            </TabNav>

            <div className="doctor-messages-form__content animate-fadeIn">
                {activeSubTab === 'templates' && (
                    <section className="doctor-messages-form__section">
                        <MessageTemplateEditor
                            id="doctor-reminder-template"
                            label={t('presential_reminder_label')}
                            value={data.reminder_template}
                            settingKey="reminder_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />

                        <MessageTemplateEditor
                            id="doctor-reminder-virtual-template"
                            label={t('virtual_reminder_label')}
                            value={data.reminder_virtual_template}
                            settingKey="reminder_virtual_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />
                    </section>
                )}

                {activeSubTab === 'confirmation' && (
                    <section className="doctor-messages-form__section">
                        <MessageTemplateEditor
                            id="doctor-confirmation-template"
                            label={t('presential_confirmation_label')}
                            value={data.confirmation_template}
                            settingKey="confirmation_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />

                        <MessageTemplateEditor
                            id="doctor-confirmation-virtual-template"
                            label={t('virtual_confirmation_label')}
                            value={data.confirmation_virtual_template}
                            settingKey="confirmation_virtual_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />
                    </section>
                )}

                {activeSubTab === 'ai' && (
                    <section className="doctor-messages-form__section doctor-messages-form__section--ai">
                        <div className="doctor-messages-form__ai-grid">
                            <div className="doctor-messages-form__field">
                                <label className="doctor-messages-form__label">
                                    {t('gemini_context_label') || 'Instrucciones para la IA (Basadas en Reglas de Negocio)'}
                                </label>
                                
                                <div className="doctor-messages-form__vars">
                                    {commonVars.map(variable => (
                                        <button
                                            key={variable}
                                            type="button"
                                            className="doctor-messages-form__var-btn"
                                            onClick={() => insertVariable('gemini-context-textarea', variable, 'gemini_context')}
                                        >
                                            {variable}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    id="gemini-context-textarea"
                                    className="doctor-messages-form__textarea"
                                    value={data.gemini_context || ''}
                                    onChange={(e) => updateField('gemini_context', e.target.value)}
                                    placeholder={t('gemini_context_placeholder') || 'Ej: Respondé siempre con un tono muy amable...'}
                                    rows={12}
                                />
                                <span className="doctor-messages-form__hint">
                                    {t('gemini_context_hint') || 'Aquí podés editar las reglas de negocio que usará la IA para responder.'}
                                </span>
                            </div>

                            <div className="doctor-messages-form__field doctor-messages-form__field--narrow">
                                <label className="doctor-messages-form__label">
                                    {t('gemini_api_version_label') || 'Versión API'}
                                </label>
                                <select
                                    className="doctor-messages-form__input"
                                    value={data.gemini_api_version || 'v1beta'}
                                    onChange={(e) => updateField('gemini_api_version', e.target.value)}
                                >
                                    <option value="v1">v1 (Estable)</option>
                                    <option value="v1beta">v1beta (Preview)</option>
                                </select>
                            </div>

                            <div className="doctor-messages-form__field doctor-messages-form__field--narrow">
                                <label className="doctor-messages-form__label">
                                    {t('gemini_model_label') || 'Modelo'}
                                </label>
                                <select
                                    className="doctor-messages-form__input"
                                    value={data.gemini_model || 'gemini-2.5-flash'}
                                    onChange={(e) => updateField('gemini_model', e.target.value)}
                                >
                                    <option value="gemini-2.5-flash">gemini-2.5-flash (Recomendado 2026)</option>
                                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                    <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                                    <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite (Experimental)</option>
                                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                                </select>
                            </div>

                            <div className="doctor-messages-form__field doctor-messages-form__field--narrow">
                                <label className="doctor-messages-form__label">
                                    {t('gemini_history_limit_label') || 'Memoria'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="doctor-messages-form__input"
                                    value={data.gemini_history_limit || 3}
                                    onChange={(e) => updateField('gemini_history_limit', parseInt(e.target.value) || 3)}
                                />
                                <span className="doctor-messages-form__hint">
                                    {t('gemini_history_limit_hint') || 'Cant. de mensajes.'}
                                </span>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <footer className="doctor-messages-form__footer">
                <p className="doctor-messages-form__hint">
                    <Icon name="INFO" size="0.8rem" />
                    {t('doctor_messages_hint') || 'Si dejás un campo en blanco, se usará la configuración general del sistema.'}
                </p>
            </footer>
        </div>
    );
};

export default DoctorMessagesForm;
