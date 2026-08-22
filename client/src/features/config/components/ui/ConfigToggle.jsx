import React from 'react';
import { Switch } from '@/components/atoms/Switch';
import styles from './ConfigToggle.module.css';

/**
 * ConfigToggle Molecule (Feature Component).
 * Renders a switch with a label and hint description for dashboard settings.
 */
export const ConfigToggle = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
    className = ''
}) => {
    return (
        <div className={`${styles.ConfigToggle__root} ${disabled ? styles['ConfigToggle--disabled'] : ''} ${className}`.trim()}>
            {(label || description) && (
                <div className={styles.ConfigToggle__content}>
                    {label && (
                        <label className={styles.ConfigToggle__label} htmlFor={id}>
                            {label}
                        </label>
                    )}
                    {description && (
                        <span className={styles.ConfigToggle__hint}>{description}</span>
                    )}
                </div>
            )}
            <div className={styles.ConfigToggle__switch}>
                <Switch
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};
