import React, { useMemo, useState } from 'react';
import { Icon } from '@/components/atoms/Icon';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';
import styles from './DoctorMessagesForm.module.css';

/**
 * DoctorMessagesForm Molecule
 * 
 * Allows a doctor to customize their specific message templates.
 */
export const DoctorMessagesForm = ({ data, onChange, settings, t }) => {
    const [activeSubTab, setActiveSubTab] = useState('templates'); // 'templates', 'confirmation'

    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}',
        '{cbu}', '{alias}', '{bio}', '{horarios}', '{feriados}'
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
        <div className={`${styles.DoctorMessagesForm__root} animate-fade-in`}>
            <TabNav className={`${styles.DoctorMessagesForm__subtabs}`}>
                {[
                    { id: 'templates', label: t('reminders_tab'), icon: 'history' },
                    { id: 'confirmation', label: t('confirmations_tab'), icon: 'check_circle' }
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

                        <div className={`${styles.DoctorMessagesForm__divider}`}></div>

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
                    <section className={`${styles.DoctorMessagesForm__section} animate-fade-in`}>
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

                        <div className={`${styles.DoctorMessagesForm__divider}`}></div>

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


