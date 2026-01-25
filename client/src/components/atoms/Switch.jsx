import React from 'react';

const Switch = ({ id, checked, onChange, disabled, label, className = '' }) => {
    return (
        <label className={`switch-container ${className}`}>
            <div className="switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="slider"></span>
            </div>
            {label && (
                <span className="input-label m-0 cursor-pointer select-none">
                    {label}
                </span>
            )}
        </label>
    );
};

export default Switch;
