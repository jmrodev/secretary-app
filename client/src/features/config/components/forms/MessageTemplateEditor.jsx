import React from 'react';
import { AutoTextarea } from '@/components/atoms/AutoTextarea';
import { Button } from '@/components/atoms/Button';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import sharedStyles from '@/styles/shared.module.css';
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

export const MessageTemplateEditor = ({
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
        <div className={`${styles.MessageTemplateEditor__root} ${sharedStyles.AnimateFadeIn}`}>
            <label className={`${styles.MessageTemplateEditor__label}`} htmlFor={id}>{label}</label>

            <AutoTextarea
                id={id}
                className={`${styles.MessageTemplateEditor__textarea}`}
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
                disabled={disabled}
            />

            <div className={`${styles.MessageTemplateEditor__variables}`}>
                <p className={`${styles.MessageTemplateEditor__variablesLabel}`}>{t('available_variables')}</p>
                <div className={`${styles.MessageTemplateEditor__buttons}`}>
                    {variables.map(v => (
                        <Button
                            key={v}
                            type="button"
                            className={`${styles.MessageTemplateEditor__variableBtn}`}
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
                <div className={`${styles.MessageTemplateEditor__metaGrid}`}>
                    <ConfigField
                        label={t('meta_template_name')}
                        type="text"
                        placeholder={t('meta_template_name_placeholder') || "ej: reminder_template"}
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
                <span className={`${styles.MessageTemplateEditor__hint}`}>{description}</span>
            )}
        </div>
    );
};

