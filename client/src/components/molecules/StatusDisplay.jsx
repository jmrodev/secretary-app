import React from 'react';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import './StatusDisplay.css';

/**
 * Molecule component to display various page statuses (Loading, Error, Success).
 * Uses BEM naming convention.
 */
const StatusDisplay = ({
    type = 'loading', // 'loading' | 'error' | 'success'
    title,
    message,
    icon
}) => {
    const renderContent = () => {
        switch (type) {
            case 'error':
                return (
                    <div className="status-display status-display--error">
                        <div className="status-display__icon">{icon || <Icon name="warning" size="2.5rem" />}</div>
                        <h2 className="status-display__title">{title || 'Error'}</h2>
                        <p className="status-display__message">{message}</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="status-display status-display--success">
                        <div className="status-display__icon">{icon || <Icon name="check_circle" size="2.5rem" />}</div>
                        <h2 className="status-display__title">{title || 'Completado'}</h2>
                        <p className="status-display__message">{message}</p>
                    </div>
                );
            case 'loading':
            default:
                return (
                    <div className="status-display status-display--loading">
                        <Loading text={message} />
                    </div>
                );
        }
    };

    return (
        <div className="status-display-container">
            {renderContent()}
        </div>
    );
};

export default StatusDisplay;
