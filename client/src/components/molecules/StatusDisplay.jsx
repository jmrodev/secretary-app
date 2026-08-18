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
                <div className={`${styles.root} ${styles.error}`}>
                    <div className={`${styles.icon}`}>{icon || <Icon name="warning" size="2.5rem" />}</div>
                    <h2 className={`${styles.title}`}>{title || 'Error'}</h2>
                    <p className={`${styles.message}`}>{message}</p>
                </div>
            );
        case 'success':
            return (
                <div className={`${styles.root} ${styles.success}`}>
                    <div className={`${styles.icon}`}>{icon || <Icon name="check_circle" size="2.5rem" />}</div>
                    <h2 className={`${styles.title}`}>{title || 'Completado'}</h2>
                    <p className={`${styles.message}`}>{message}</p>
                </div>
            );
        case 'loading':
        default:
            return (
                <div className={`${styles.root} status-display--loading`}>
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
        <div className={`${styles.statusDisplayContainer}`}>
            <StatusContent type={type} title={title} message={message} icon={icon} />
        </div>
    );
};

