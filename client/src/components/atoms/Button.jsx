import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    title = '',
    tooltip = null,
    icon = null
}) => {
    const baseStyles = 'btn';
    const variantStyles = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        'outline-danger': 'btn-outline-danger',
        accent: 'btn-accent',
        link: 'btn-link',
        status: 'btn-status-complete'
    };

    const sizeStyles = {
        sm: 'btn-sm',
        'sm-compact': 'btn-sm-compact',
        md: '',
        lg: 'btn-lg'
    };

    const combinedClassName = `
        ${baseStyles} 
        ${variantStyles[variant] || variantStyles.primary} 
        ${sizeStyles[size] || ''} 
        ${className}
    `.trim();

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClassName}
            title={title} // Native title as fallback
            data-tooltip={tooltip}
        >
            {icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
