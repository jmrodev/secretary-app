import React, { useMemo } from 'react';
import ConfigField from './ConfigField';
import Icon from '../../../components/atoms/Icon';
import MessageTemplateEditor from './MessageTemplateEditor';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * CommunicationSettings Feature Component.
 * Manages official clinic address and automated WhatsApp messaging templates.
 */
const CommunicationSettings = ({ user, settings, updateSetting, insertVariable }) => {
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';
    const commonVars = useMemo(() => [
        '{patient_name}', '{date}', '{time}', '{doctor_name}',
        '{appointment_type}', '{appointment_location}', '{price}', '{secretary_name}',
        '{cbu}', '{alias}', '{bio}', '{google_review_link}'
    ], []);

    return (
        <div className="tab-panel animate-fadeIn">
            {/* Clinic Address */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="CONFIG" size="1.2rem" className="config-section__icon" />
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
                    <Icon name="APPOINTMENTS" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('appointment_reminders_title')}</h4>
                </div>

                <div className="config-section__body">
                    <MessageTemplateEditor
                        id="reminder-template"
                        label={<span className="config-field__label-with-icon"><Icon name="HISTORY" size="1rem" /> {t('presential_reminder_label')}</span>}
                        value={settings.appointment_reminder_template}
                        settingKey="appointment_reminder_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        disabled={!isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_reminder_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_reminder_params_order : undefined}
                        t={t}
                    />

                    <div className="config-section__divider"></div>

                    <MessageTemplateEditor
                        id="reminder-virtual-template"
                        label={<span className="config-field__label-with-icon"><Icon name="VIRTUAL" size="1rem" /> {t('virtual_reminder_label')}</span>}
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

            {/* Appointment Confirmation */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="CHECK" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('appointment_confirmation_title')}</h4>
                </div>

                <div className="config-section__body">
                    <MessageTemplateEditor
                        id="confirmation-template"
                        label={<span className="config-field__label-with-icon"><Icon name="CHECK" size="1rem" /> {t('presential_confirmation_label')}</span>}
                        value={settings.appointment_confirmation_template}
                        settingKey="appointment_confirmation_template"
                        variables={commonVars}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        disabled={!isAdmin}
                        metaTemplateName={settings.meta_phone_number_id ? settings.meta_confirmation_template_name : undefined}
                        metaParamsOrder={settings.meta_phone_number_id ? settings.meta_confirmation_params_order : undefined}
                        description={t('confirmation_message_hint')}
                        t={t}
                    />

                    <div className="config-section__divider"></div>

                    <MessageTemplateEditor
                        id="confirmation-virtual-template"
                        label={<span className="config-field__label-with-icon"><Icon name="VIRTUAL" size="1rem" /> {t('virtual_confirmation_label')}</span>}
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

            {/* Public Requests / QR Links */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="DOCUMENTS" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('public_requests_title')}</h4>
                </div>

                <div className="config-section__body">
                    <ConfigField
                        id="google-review-link"
                        label={<span className="config-field__label-with-icon"><Icon name="STAR" size="1rem" /> {t('google_review_link_label') || 'Enlace de Reseñas de Google'}</span>}
                        type="url"
                        placeholder="Ej. https://g.page/r/.../review"
                        value={settings.google_review_link || ''}
                        onChange={(e) => updateSetting('google_review_link', e.target.value)}
                        disabled={!isAdmin}
                        hint={t('google_review_hint') || 'Ingresa el enlace directo para que los pacientes te dejen una reseña en Google. Búscalo en tu perfil de Google My Business.'}
                    />


                    <div className="config-section__divider"></div>

                    <MessageTemplateEditor
                        id="whatsapp-prescription-template"
                        label={<span className="config-field__label-with-icon"><Icon name="PRESCRIPTION" size="1rem" /> {t('prescription_request_whatsapp')}</span>}
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

                    <div className="config-section__divider"></div>

                    <MessageTemplateEditor
                        id="whatsapp-patient-data-template"
                        label={<span className="config-field__label-with-icon"><Icon name="PROFILE" size="1rem" /> {t('data_update_whatsapp')}</span>}
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

                    <div className="config-section__divider"></div>

                    <MessageTemplateEditor
                        id="medication-refill-template"
                        label={<span className="config-field__label-with-icon"><Icon name="PRESCRIPTION" size="1rem" /> {t('medication_refill_reminder_label') || 'Recordatorio de Renovación de Medicación'}</span>}
                        value={settings.medication_refill_reminder_template}
                        settingKey="medication_refill_reminder_template"
                        variables={['{patient_name}', '{medication_name}']}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                        disabled={!isAdmin}
                        description={t('medication_refill_hint') || 'Mensaje enviado para recordar la renovación de recetas.'}
                        placeholder="Hola {patient_name}, tu medicación {medication_name}..."
                        t={t}
                    />
                </div>
            </div>

        </div>
    );
};

export default CommunicationSettings;
