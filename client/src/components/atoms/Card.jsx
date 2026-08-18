import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '', title = '', footer = null, noPadding = false, as: Component = 'section' }) => {
    const combinedClasses = [
        styles.Card__root,
        className
    ].filter(Boolean).join(' ');

    return (
        <Component className={combinedClasses}>
            {title && (
                <header className={styles.Card__header}>
                    {typeof title === 'string' ? (
                        <h3 className={styles.Card__title}>{title}</h3>
                    ) : (
                        title
                    )}
                </header>
            )}
            <div className={styles.Card__content}>
                {children}
            </div>
            {footer && (
                <footer className={styles.Card__footer}>
                    {footer}
                </footer>
            )}
        </Component>
    );
};
