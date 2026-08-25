import React, { useMemo, useState, useEffect } from 'react';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Icon } from '@/components/atoms/Icon';
import { MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import styles from './CommunicationSettings.module.css';
import shared from '@/styles/shared.module.css';

/**
 * CommunicationSettings Feature Component.
 * Manages official clinic address and automated WhatsApp messaging templates.
 */
export const CommunicationSettings = ({ user, settings, updateSetting, insertVariable }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';
    
    const [localSettings, setLocalSettings] = useState({});
    
    useEffect(() => {
        setLocalSettings(settings || {});
    }, [settings]);
    
    const handleUpdateSetting = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        
        if (key.startsWith('whatsapp_template_')) {
            const trimmed = (value || '').replace(/\s/g, '');
            if (trimmed.length > 0 && trimmed.length < 20) {
                // Skip saving if invalid
                return;
            }
        }
        
        updateSetting(key, value);
    };

    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}',
        '{cbu}', '{alias}', '{bio}', '{google_review_link}'
    ], []);

    return (
        <div className={`${styles.CommunicationSettings__root} ${shared.TabPanel} ${shared.AnimateFadeIn}`}>
            {/* Clinic Address */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="settings" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>{t('clinic_address_title')}</h4>
                </div>

                <div className={shared.ConfigSection__body}>
                    <ConfigField
                        id="clinic-address"
                        label={t('physical_address_label')}
                        type="text"
                        placeholder={t('address_placeholder_example') || "Calle X, Entre Y y Z"}
                        value={settings.clinic_address || ''}
                        onChange={(e) => updateSetting('clinic_address', e.target.value)}
                        disabled={!isAdmin}
                        hint={t('physical_address_hint')}
                    />
                </div>
            </div>

            {/* Appointment Reminders */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="event" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>{t('appointment_reminders_title')}</h4>
                </div>

                <div className={shared.ConfigSection__body}>
                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                        <MessageTemplateEditor
                            id="reminder-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="history" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('presential_reminder_label')}
                                </span>
                            }
                            value={localSettings.whatsapp_template_reminder}
                            settingKey="whatsapp_template_reminder"
                            variables={commonVars}
                            updateSetting={handleUpdateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            metaTemplateName={localSettings.meta_phone_number_id ? localSettings.meta_reminder_template_name : undefined}
                            metaParamsOrder={localSettings.meta_phone_number_id ? localSettings.meta_reminder_params_order : undefined}
                            t={t}
                        />

                        <MessageTemplateEditor
                            id="reminder-virtual-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="video_chat" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('virtual_reminder_label')}
                                </span>
                            }
                            value={settings.appointment_reminder_virtual_template}
                            settingKey="appointment_reminder_virtual_template"
                            variables={commonVars}
                            updateSetting={updateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* Appointment Confirmation */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="check_circle" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>{t('appointment_confirmation_title')}</h4>
                </div>

                <div className={shared.ConfigSection__body}>
                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                        <MessageTemplateEditor
                            id="confirmation-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="check" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('presential_confirmation_label')}
                                </span>
                            }
                            value={localSettings.whatsapp_template_confirmation}
                            settingKey="whatsapp_template_confirmation"
                            variables={commonVars}
                            updateSetting={handleUpdateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            metaTemplateName={localSettings.meta_phone_number_id ? localSettings.meta_confirmation_template_name : undefined}
                            metaParamsOrder={localSettings.meta_phone_number_id ? localSettings.meta_confirmation_params_order : undefined}
                            description={t('confirmation_message_hint')}
                            t={t}
                        />

                        <MessageTemplateEditor
                            id="confirmation-virtual-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="video_chat" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('virtual_confirmation_label')}
                                </span>
                            }
                            value={settings.appointment_confirmation_virtual_template}
                            settingKey="appointment_confirmation_virtual_template"
                            variables={commonVars}
                            updateSetting={updateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* Debt Reminders */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="payments" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>Recordatorios de Deuda</h4>
                </div>
                <div className={shared.ConfigSection__body}>
                    <MessageTemplateEditor
                        id="debt-template"
                        label="Plantilla de Deuda"
                        value={localSettings.whatsapp_template_debt}
                        settingKey="whatsapp_template_debt"
                        variables={['{patient_name}', '{debt_amount}']}
                        updateSetting={handleUpdateSetting}
                        insertVariable={insertVariable}
                        disabled={!isAdmin}
                        t={t}
                    />
                </div>
            </div>

            {/* Pending Approvals */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="pending_actions" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>Gestión de Turnos Pendientes</h4>
                </div>
                <div className={shared.ConfigSection__body}>
                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                        <MessageTemplateEditor
                            id="accept-template"
                            label="Aceptar Turno"
                            value={localSettings.whatsapp_template_accept}
                            settingKey="whatsapp_template_accept"
                            variables={['{patient_name}', '{date}', '{time}', '{doctor_name}']}
                            updateSetting={handleUpdateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            t={t}
                        />
                        <MessageTemplateEditor
                            id="alternative-template"
                            label="Sugerir Alternativa"
                            value={localSettings.whatsapp_template_alternative}
                            settingKey="whatsapp_template_alternative"
                            variables={['{patient_name}', '{date}', '{time}']}
                            updateSetting={handleUpdateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* Public Requests / QR Links */}
            <div className={shared.ConfigSection}>
                <div className={shared.ConfigSection__header}>
                    <Icon name="description" size="1.2rem" className={shared.ConfigSection__icon} />
                    <h4 className={shared.ConfigSection__title}>{t('public_requests_title')}</h4>
                </div>

                <div className={shared.ConfigSection__body}>
                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                        <MessageTemplateEditor
                            id="whatsapp-prescription-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="medication" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('prescription_request_whatsapp')}
                                </span>
                            }
                            value={settings.whatsapp_prescription_request_template}
                            settingKey="whatsapp_prescription_request_template"
                            variables={['{patient_name}', '{link}']}
                            updateSetting={updateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            description={t('prescription_request_hint')}
                            placeholder={t('placeholder_prescription_req')}
                            t={t}
                        />

                        <MessageTemplateEditor
                            id="whatsapp-patient-data-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="account_circle" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('data_update_whatsapp')}
                                </span>
                            }
                            value={settings.whatsapp_patient_data_request_template}
                            settingKey="whatsapp_patient_data_request_template"
                            variables={['{patient_name}', '{link}']}
                            updateSetting={updateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            description={t('data_update_hint')}
                            placeholder={t('placeholder_data_req')}
                            t={t}
                        />
                    </div>

                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                        <ConfigField
                            id="google-review-link"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="star" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('google_review_link_label') || 'Enlace de Reseñas de Google'}
                                </span>
                            }
                            type="url"
                            placeholder={t('google_review_placeholder_example') || "Ej. https://g.page/r/.../review"}
                            value={settings.google_review_link || ''}
                            onChange={(e) => updateSetting('google_review_link', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('google_review_hint') || 'Ingresa el enlace directo para que los pacientes te dejen una reseña en Google. Búscalo en tu perfil de Google My Business.'}
                        />

                        <MessageTemplateEditor
                            id="medication-refill-template"
                            label={
                                <span className={`${styles.CommunicationSettings__labelWithIcon}`}>
                                    <Icon name="medication" size="1rem" className={`${styles.CommunicationSettings__labelIcon}`} /> 
                                    {t('medication_refill_reminder_label') || 'Recordatorio de Renovación de Medicación'}
                                </span>
                            }
                            value={settings.medication_refill_reminder_template}
                            settingKey="medication_refill_reminder_template"
                            variables={['{patient_name}', '{medication_name}']}
                            updateSetting={updateSetting}
                            insertVariable={insertVariable}
                            disabled={!isAdmin}
                            description={t('medication_refill_hint') || 'Mensaje enviado para recordar la renovación de recetas.'}
                            placeholder={t('medication_refill_placeholder_example') || "Hola {patient_name}, tu medicación {medication_name}..."}
                            t={t}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

