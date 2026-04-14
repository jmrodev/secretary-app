import React from 'react';
import AutoTextarea from '@/components/atoms/AutoTextarea';
import ConfigField from './ConfigField';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './MessageTemplateEditor.css';

/**
 * MessageTemplateEditor Molecule (Feature Component).
 * Standardized editor for communication templates across system and provider settings.
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
        '{link}': t('link_var'),
        '{cbu}': t('cbu_var'),
        '{alias}': t('alias_var'),
        '{bio}': t('bio_var')
    };
    return labels[variable] || variable;
};

const MessageTemplateEditor = ({
    id,
    label,
    value,
    settingKey,
    placeholder,
    variables = [],
    updateSetting,
    insertVariable,
    disabled,
    metaTemplateName,
    metaParamsOrder,
    description,
    t
}) => {
    return (
        <div className="message-template-editor animate-fadeIn">
            <label className="message-template-editor__label" htmlFor={id}>{label}</label>

            <AutoTextarea
                id={id}
                className="message-template-editor__textarea"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
                disabled={disabled}
            />

            <div className="message-template-editor__variables">
                <p className="message-template-editor__variables-label">{t('available_variables')}</p>
                <div className="message-template-editor__buttons">
                    {variables.map(v => (
                        <Button
                            key={v}
                            variant="ghost"
                            size="sm"
                            className="message-template-editor__variable-btn"
                            onClick={() => insertVariable(id, v, settingKey)}
                            title={t('insert_variable_title').replace('{variable}', v)}
                            disabled={disabled}
                        >
                            {getFriendlyVarLabel(v, t)}
                        </Button>
                    ))}
                </div>
            </div>

            {(metaTemplateName !== undefined) && (
                <div className="message-template-editor__meta-grid">
                    <ConfigField
                        label={t('meta_template_name')}
                        type="text"
                        placeholder={t('meta_template_name_placeholder')}
                        value={metaTemplateName || ''}
                        onChange={(e) => updateSetting(
                            settingKey === 'appointment_reminder_template'
                                ? 'meta_reminder_template_name'
                                : 'meta_confirmation_template_name',
                            e.target.value
                        )}
                        disabled={disabled}
                    />
                    {metaParamsOrder !== undefined && (
                        <ConfigField
                            label={t('variable_order')}
                            type="text"
                            placeholder={t('variable_order_placeholder')}
                            value={metaParamsOrder || ''}
                            onChange={(e) => updateSetting(
                                settingKey === 'appointment_reminder_template'
                                    ? 'meta_reminder_params_order'
                                    : 'meta_confirmation_params_order',
                                e.target.value
                            )}
                            disabled={disabled}
                        />
                    )}
                </div>
            )}

            {description && (
                <span className="message-template-editor__hint">{description}</span>
            )}
        </div>
    );
};

export default MessageTemplateEditor;
