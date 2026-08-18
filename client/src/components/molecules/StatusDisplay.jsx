import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import styles from './StatusDisplay.module.css';

/**
 * Molecule component to display various page statuses (Loading, Error, Success).
 * Uses BEM naming convention.
 */
const StatusContent = ({ type, title, message, icon }) => {
    switch (type) {
        case 'error':
            return (
                <div className={`${styles.StatusDisplay__root} ${styles.StatusDisplay__error}`}>
                    <div className={`${styles.StatusDisplay__icon}`}>{icon || <Icon name="warning" size="2.5rem" />}</div>
                    <h2 className={`${styles.StatusDisplay__title}`}>{title || 'Error'}</h2>
                    <p className={`${styles.StatusDisplay__message}`}>{message}</p>
                </div>
            );
        case 'success':
            return (
                <div className={`${styles.StatusDisplay__root} ${styles.StatusDisplay__success}`}>
                    <div className={`${styles.StatusDisplay__icon}`}>{icon || <Icon name="check_circle" size="2.5rem" />}</div>
                    <h2 className={`${styles.StatusDisplay__title}`}>{title || 'Completado'}</h2>
                    <p className={`${styles.StatusDisplay__message}`}>{message}</p>
                </div>
            );
        case 'loading':
        default:
            return (
                <div className={`${styles.StatusDisplay__root} status-display--loading`}>
                    <Loading text={message} />
                </div>
            );
    }
};

export const StatusDisplay = ({
    type = 'loading', // 'loading' | 'error' | 'success'
    title,
    message,
    icon
}) => {
    return (
        <div className={`${styles.StatusDisplay__statusDisplayContainer}`}>
            <StatusContent type={type} title={title} message={message} icon={icon} />
        </div>
    );
};

