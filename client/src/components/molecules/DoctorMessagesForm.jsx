import React, { useMemo } from 'react';
import MessageTemplateEditor from '../molecules/MessageTemplateEditor';
import Icon from '../atoms/Icon';
import './DoctorMessagesForm.css';

/**
 * DoctorMessagesForm Molecule
 * 
 * Allows a doctor to customize their specific message templates.
 */
const DoctorMessagesForm = ({ data, onChange, t }) => {
    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}',
        '{cbu}', '{alias}', '{bio}'
    ], []);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
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
                <Icon name="CHAT" size="1.2rem" />
                <h3 className="doctor-messages-form__title">{t('doctor_messages_config') || 'Configuración de Mensajes Personalizados'}</h3>
            </header>

            <div className="doctor-messages-form__grid">
                <section className="doctor-messages-form__section">
                    <h4 className="doctor-messages-form__section-title">
                        <Icon name="APPOINTMENTS" size="1rem" /> {t('appointment_reminders_title')}
                    </h4>

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

                <section className="doctor-messages-form__section">
                    <h4 className="doctor-messages-form__section-title">
                        <Icon name="CHECK" size="1rem" /> {t('appointment_confirmation_title')}
                    </h4>

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
            </div>

            <footer className="doctor-messages-form__footer">
                <p className="doctor-messages-form__hint">
                    <Icon name="INFO" size="0.8rem" />
                    {t('doctor_messages_hint') || 'Si dejas un mensaje en blanco, se utilizará el mensaje general configurado en el sistema.'}
                </p>
            </footer>
        </div>
    );
};

export default DoctorMessagesForm;
