import React from 'react';

const FormGroup = ({ label, children, error, required = false, className = '' }) => {
    const baseClass = 'form-group';
    const requiredClass = required ? `${baseClass}--required` : '';

    return (
        <div className={`${baseClass} ${requiredClass} ${className}`}>
            {label && (
                <label className={`${baseClass}__label`}>
                    {label}
                </label>
            )}
            <div className={`${baseClass}__content`}>
                {children}
            </div>
            {error && <p className={`${baseClass}__error`}>{error}</p>}
        </div>
    );
};

export default FormGroup;
