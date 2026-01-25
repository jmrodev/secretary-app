import React from 'react';

const FormGroup = ({ label, children, error, required = false, className = '' }) => {
    return (
        <div className={`input-group ${className}`}>
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default FormGroup;
