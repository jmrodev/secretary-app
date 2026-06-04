import React from 'react';
import AutoTextarea from '@/components/atoms/AutoTextarea';
import Button from '@/components/atoms/Button';
import ConfigField from '@/features/config/components/ui/ConfigField';
import styles from './MessageTemplateEditor.module.css';

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

const EMPTY_ARRAY = [];

const MessageTemplateEditor = ({
    id,
    label,
    value,
    settingKey,
    placeholder,
    variables = EMPTY_ARRAY,
    updateSetting,
    insertVariable,
    disabled,
    metaTemplateName,
    metaParamsOrder,
    description,
    t
}) => {
    return (
        <div className={`${styles.root} animate-fade-in`}>
            <label className={`${styles.label}`} htmlFor={id}>{label}</label>

            <AutoTextarea
                id={id}
                className={`${styles.textarea}`}
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
                disabled={disabled}
            />

            <div className={`${styles.variables}`}>
                <p className={`${styles.variablesLabel}`}>{t('available_variables')}</p>
                <div className={`${styles.buttons}`}>
                    {variables.map(v => (
                        <Button
                            key={v}
                            type="button"
                            className={`${styles.variableBtn}`}
                            onClick={() => insertVariable(id, v, settingKey)}
                            title={t('insert_variable_title').replace('{variable}', v)}
                            disabled={disabled}
                            unstyled
                        >
                            {getFriendlyVarLabel(v, t)}
                        </Button>
                    ))}
                </div>
            </div>

            {(metaTemplateName !== undefined) && (
                <div className={`${styles.metaGrid}`}>
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
                        disabled={disabled}
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
                            disabled={disabled}
                        />
                    )}
                </div>
            )}

            {description && (
                <span className={`${styles.hint}`}>{description}</span>
            )}
        </div>
    );
};

export default MessageTemplateEditor;
