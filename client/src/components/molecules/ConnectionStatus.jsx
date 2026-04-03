import React from 'react';
import StatusIndicator from '../atoms/StatusIndicator';
import Button from '../atoms/Button';

import './ConnectionStatus.css';

/**
 * ConnectionStatus Molecule
 * 
 * Single Responsibility: Display integration connection status with actions
 * Composition: StatusIndicator + Description + Action Buttons
 * 
 * @param {Object} props
 * @param {boolean} props.isConnected - Connection status
 * @param {string} props.serviceName - Name of the service (e.g., "Google Calendar")
 * @param {string} [props.description] - Description text
 * @param {Function} [props.onConnect] - Connect button handler
 * @param {Function} [props.onDisconnect] - Disconnect button handler
 * @param {React.ReactNode} [props.children] - Additional content
 * @param {string} [props.className] - Additional CSS classes
 */
const ConnectionStatus = ({
    isConnected,
    serviceName,
    description,
    onConnect,
    onDisconnect,
    children,
    className = ''
}) => {
    const status = isConnected ? 'connected' : 'disconnected';
    const statusLabel = isConnected
        ? `Conectado a ${serviceName}`
        : `Desconectado de ${serviceName}`;

    return (
        <div className={`connection-status config-group ${className}`}>
            <div className="config-group__header">
                <div>
                    <StatusIndicator status={status} label={statusLabel} />
                    {description && (
                        <p className="config-field__hint config-field__hint--spaced">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {children && (
                <div className="config-group__items">
                    {children}
                </div>
            )}

            <div className="config-actions">
                {!isConnected && onConnect && (
                    <Button onClick={onConnect}>
                        Conectar {serviceName}
                    </Button>
                )}
                {isConnected && onDisconnect && (
                    <Button variant="danger" onClick={onDisconnect}>
                        Desconectar
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;
