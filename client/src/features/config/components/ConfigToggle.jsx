import React from 'react';
import Switch from '@/components/atoms/Switch';

/**
 * ConfigToggle Molecule (Feature Component).
 * Renders a switch with a label and hint description for dashboard settings.
 */
const ConfigToggle = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
    className = ''
}) => {
    return (
        <div className={`config-field config-field--inline ${className}`}>
            <div>
                <label className="config-field__label" htmlFor={id}>
                    {label}
                </label>
                {description && (
                    <span className="config-field__hint">{description}</span>
                )}
            </div>
            <Switch
                id={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    );
};

export default ConfigToggle;
