import React from 'react';
import './Badge.css';

/**
 * Badge Atom Component.
 * Displays a badge or notification counter.
 * 
 * @param {React.ReactNode} children - Content to display in the badge
 * @param {string} variant - Color variant: 'default', 'danger', 'success', 'warning', 'blue', 'accent', etc.
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Optional click handler
 * @param {string} title - Optional tooltip text
 * @param {number} count - For notification mode: the count to display
 * @param {string} position - For notification mode: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 */
const Badge = ({
    children,
    variant = 'default',
    className = '',
    onClick = null,
    title = '',
    count = null,
    position = 'top-right'
}) => {
    // Notification mode: when count is provided
    if (count !== null && count !== undefined) {
        if (count <= 0) return null;

        return (
            <span
                className={`badge badge--notification badge--${position} ${className}`}
                title={title}
            >
                {count > 99 ? '99+' : count}
            </span>
        );
    }

    // Standard badge mode
    const baseClass = 'badge';
    const normalizedVariant = variant.replace('status-', '').replace('chip-', '');
    const variantClass = `${baseClass}--${normalizedVariant}`;
    const interactiveClass = onClick ? `${baseClass}--interactive` : '';

    return (
        <span
            className={`${baseClass} ${variantClass} ${interactiveClass} ${className}`}
            onClick={onClick}
            title={title}
        >
            {children}
        </span>
    );
};

export default Badge;

