import React from 'react';

/**
 * Alert Atom
 * 
 * Single Responsibility: Display alert/info boxes with different variants
 * 
 * @param {Object} props
 * @param {'info' | 'warning' | 'success'} props.variant - Alert variant
 * @param {string} [props.title] - Alert title
 * @param {string} [props.message] - Alert message
 * @param {React.ReactNode} [props.children] - Alert content (alternative to message)
 * @param {string} [props.className] - Additional CSS classes
 */
const Alert = ({
    variant = 'info',
    title,
    message,
    children,
    className = ''
}) => {
    const variantClass = `config-alert--${variant}`;

    return (
        <div className={`config-alert ${variantClass} ${className}`}>
            {title && <h4 className="config-alert__title">{title}</h4>}
            {message && <p className="config-alert__message">{message}</p>}
            {children && <div className="config-alert__message">{children}</div>}
        </div>
    );
};

export default Alert;
