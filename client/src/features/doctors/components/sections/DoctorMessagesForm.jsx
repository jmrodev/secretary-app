import React, { useMemo, useState } from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import TabNav from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { GEMINI_VALID_MODELS, normalizeGeminiModel } from '@/constants/aiModels';
import styles from './DoctorMessagesForm.module.css';

/**
 * DoctorMessagesForm Molecule
 * 
 * Allows a doctor to customize their specific message templates and AI context.
 */
export const DoctorMessagesForm = ({ data, onChange, settings, t, MessageTemplateEditorComponent }) => {
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
        <div className={`${styles.DoctorMessagesForm__root} animate-fade-in`}>
            <TabNav className={`${styles.DoctorMessagesForm__subtabs}`}>
                {[
                    { id: 'templates', label: t('reminders_tab'), icon: 'history' },
                    { id: 'confirmation', label: t('confirmations_tab'), icon: 'check_circle' },
                    { id: 'ai', label: t('ai_tab'), icon: 'psychology' }
                ].map(tab => (
                    <TabButton 
                        key={tab.id}
                        isActive={activeSubTab === tab.id} 
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`${styles.DoctorMessagesForm__tabButton}`}
                    >
                        <Icon name={tab.icon} size="0.9rem" className={`${styles.DoctorMessagesForm__tabIcon}`} />
                        {tab.label}
                    </TabButton>
                ))}
            </TabNav>

            <div className={`${styles.DoctorMessagesForm__content}`}>
                {activeSubTab === 'templates' && (
                    <section className={`${styles.DoctorMessagesForm__section} animate-fade-in`}>
                        <MessageTemplateEditorComponent
                            id="doctor-reminder-template"
                            label={t('presential_reminder_label')}
                            value={data.reminder_template}
                            settingKey="reminder_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />

                        <div className={`${styles.DoctorMessagesForm__divider}`}></div>

                        <MessageTemplateEditorComponent
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
                    <section className={`${styles.DoctorMessagesForm__section} animate-fade-in`}>
                        <MessageTemplateEditorComponent
                            id="doctor-confirmation-template"
                            label={t('presential_confirmation_label')}
                            value={data.confirmation_template}
                            settingKey="confirmation_template"
                            variables={commonVars}
                            updateSetting={updateField}
                            insertVariable={insertVariable}
                            t={t}
                        />

                        <div className={`${styles.DoctorMessagesForm__divider}`}></div>

                        <MessageTemplateEditorComponent
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
                    <section className={`${styles.DoctorMessagesForm__section} ${styles.DoctorMessagesForm__sectionAi} animate-fade-in`}>
                        <header className={`${styles.DoctorMessagesForm__aiHeader}`}>
                            <div className={`${styles.DoctorMessagesForm__aiTitleGroup}`}>
                                <Icon name="psychology" size="1.2rem" className={`${styles.DoctorMessagesForm__aiIcon}`} />
                                <h4 className={`${styles.DoctorMessagesForm__aiTitle}`}>{t('gemini_config_title') || 'Configuración IA Gemini'}</h4>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleAutoFill}
                                className="doctor-messages-form__autofill-btn"
                            >
                                <Icon name="sync" size="1rem" />
                                {t('load_base_rules')}
                            </Button>
                        </header>

                        <div className={`${styles.DoctorMessagesForm__aiGrid}`}>
                            <div className={`${styles.DoctorMessagesForm__field} doctor-messages-form__field--main`}>
                                <label className={`${styles.DoctorMessagesForm__label}`}>
                                    {t('gemini_context_label')}
                                </label>
                                
                                <div className={`${styles.DoctorMessagesForm__vars}`}>
                                    {commonVars.map(variable => (
                                        <button
                                            key={variable}
                                            type="button"
                                            className={`${styles.DoctorMessagesForm__varBtn}`}
                                            onClick={() => insertVariable('gemini-context-textarea', variable, 'gemini_context')}
                                            title={t('insert_variable_title').replace('{variable}', variable)}
                                        >
                                            {variable}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    id="gemini-context-textarea"
                                    className={`${styles.DoctorMessagesForm__textarea}`}
                                    value={data.gemini_context || ''}
                                    onChange={(e) => updateField('gemini_context', e.target.value)}
                                    placeholder={t('gemini_context_placeholder')}
                                    rows={10}
                                />
                                <span className="doctor-messages-form__hint">
                                    {t('gemini_context_hint')}
                                </span>
                            </div>

                            <aside className={`${styles.DoctorMessagesForm__aiSidebar}`}>
                                <div className={`${styles.DoctorMessagesForm__field}`}>
                                    <label className={`${styles.DoctorMessagesForm__label}`}>
                                        {t('gemini_api_version_label')}
                                    </label>
                                    <select
                                        className={`${styles.DoctorMessagesForm__input}`}
                                        value={data.gemini_api_version || 'v1beta'}
                                        onChange={(e) => updateField('gemini_api_version', e.target.value)}
                                    >
                                        <option value="v1">{t('gemini_api_version_option_v1')}</option>
                                        <option value="v1beta">{t('gemini_api_version_option_v1beta')}</option>
                                    </select>
                                </div>

                                <div className={`${styles.DoctorMessagesForm__field}`}>
                                    <label className={`${styles.DoctorMessagesForm__label}`}>
                                        {t('gemini_model_label')}
                                    </label>
                                    <select
                                        className={`${styles.DoctorMessagesForm__input}`}
                                        value={normalizeGeminiModel(data.gemini_model) || 'gemini-3.6-flash'}
                                        onChange={(e) => updateField('gemini_model', e.target.value)}
                                    >
                                        {GEMINI_VALID_MODELS.map((model) => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={`${styles.DoctorMessagesForm__field}`}>
                                    <label className={`${styles.DoctorMessagesForm__label}`}>
                                        {t('gemini_history_limit_label')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className={`${styles.DoctorMessagesForm__input}`}
                                        value={data.gemini_history_limit || 3}
                                        onChange={(e) => updateField('gemini_history_limit', parseInt(e.target.value) || 3)}
                                    />
                                    <span className="doctor-messages-form__hint">
                                        {t('gemini_history_limit_hint')}
                                    </span>
                                </div>
                            </aside>
                        </div>
                    </section>
                )}
            </div>

            <footer className={`${styles.DoctorMessagesForm__footer}`}>
                <Icon name="info" size="1rem" className={`${styles.DoctorMessagesForm__infoIcon}`} />
                <p className={`${styles.DoctorMessagesForm__footerText}`}>
                    {t('doctor_messages_hint')}
                </p>
            </footer>
        </div>
    );
};


