import React from 'react';
import './Button.css';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // primary, secondary, danger, outline-danger, accent, link, ghost, status
    size = 'md', // sm, sm-compact, md, lg
    disabled = false,
    className = '',
    title = '',
    tooltip = null,
    icon = null,
    active = false
}) => {
    const baseClass = 'btn';

    // Construct BEM classes
    const variantClass = variant ? `${baseClass}--${variant}` : '';
    const sizeClass = size && size !== 'md' ? `${baseClass}--${size}` : '';
    const activeClass = active ? `${baseClass}--active` : '';

    const combinedClassName = `
        ${baseClass} 
        ${variantClass} 
        ${sizeClass} 
        ${activeClass}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClassName}
            title={title}
            data-tooltip={tooltip}
        >
            {icon && <span className="btn__icon">{icon}</span>}
            {children && <span className="btn__content">{children}</span>}
        </button>
    );
};

export default Button;
