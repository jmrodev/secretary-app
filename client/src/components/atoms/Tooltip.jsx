import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import styles from './Tooltip.module.css';

/**
 * Tooltip Atom.
 * Displays a help icon that shows text on hover.
 */
export const Tooltip = ({ text, position = 'top' }) => {
    if (!text) return null;

    return (
        <div className={`${styles.Tooltip__root} tooltip--${position}`}>
            <Icon name="INFO" size="1.1rem" className={`${styles.Tooltip__icon}`} />
            <div className={`${styles.Tooltip__content}`}>
                {text}
            </div>
        </div>
    );
};
