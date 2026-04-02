import React from 'react';
import './ConfigField.css';
import Switch from '../atoms/Switch';

/**
 * ConfigToggle Molecule
 * 
 * Single Responsibility: Render a switch with label and description
 * Composition: Switch + Label + Description
 * 
 * @param {Object} props
 * @param {string} props.id - Toggle ID
 * @param {string} props.label - Toggle label
 * @param {string} [props.description] - Helper description
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.className] - Additional CSS classes
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
