import React from 'react';
import styles from './Loading.module.css';

/**
 * Loading Atom.
 * Displays a spinner. Following a strict BEM and Atomic approach (No inline styles).
 * 
 * @param {string} variant - 'full-page' | 'centered' | 'inline'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} text - Optional loading text
 * @param {string} className - Additional classes
 */
const Loading = ({
    variant = 'centered',
    size = 'md',
    text,
    className = ''
}) => {
    const baseClass = styles.root;
    const variantClass = `${baseClass}--${variant}`;
    const sizeClass = `${baseClass}__spinner--${size}`;

    return (
        <div className={`${baseClass} ${variantClass} ${className}`}>
            <div className={`${baseClass}__spinner ${sizeClass}`} />
            {text && <span className={`${baseClass}__text`}>{text}</span>}
        </div>
    );
};

export default Loading;
