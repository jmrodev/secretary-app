import React from 'react';

/**
 * StatusIndicator Atom
 * 
 * Single Responsibility: Display connection/status indicator with label
 * 
 * @param {Object} props
 * @param {'connected' | 'disconnected'} props.status - Connection status
 * @param {string} props.label - Status label text
 * @param {string} [props.className] - Additional CSS classes
 */
const StatusIndicator = ({ status, label, className = '' }) => {
    const statusClass = status === 'connected'
        ? 'config-status--connected'
        : 'config-status--disconnected';

    return (
        <div className={`config-status ${statusClass} ${className}`}>
            <span className="config-status__indicator" aria-hidden="true"></span>
            <span>{label}</span>
        </div>
    );
};

export default StatusIndicator;
