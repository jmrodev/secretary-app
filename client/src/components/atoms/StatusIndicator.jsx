import React from 'react';
import './StatusIndicator.css';

/**
 * StatusIndicator Atom follows Atomic Design & BEM.
 */
const StatusIndicator = ({ status, label, className = '' }) => {
    const baseClass = 'status-indicator';
    const statusClass = `${baseClass}--${status}`;

    return (
        <div className={`${baseClass} ${statusClass} ${className}`}>
            <span className={`${baseClass}__dot`} aria-hidden="true"></span>
            <span className={`${baseClass}__label`}>{label}</span>
        </div>
    );
};

export default StatusIndicator;
