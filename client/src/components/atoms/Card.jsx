import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className = '', title = '', footer = null, noPadding = false, as: Component = 'section' }) => {
    const combinedClasses = [
        styles.root,
        className
    ].filter(Boolean).join(' ');

    return (
        <Component className={combinedClasses}>
            {title && (
                <header className={styles.header}>
                    {typeof title === 'string' ? (
                        <h3 className={styles.title}>{title}</h3>
                    ) : (
                        title
                    )}
                </header>
            )}
            <div className={styles.content}>
                {children}
            </div>
            {footer && (
                <footer className={styles.footer}>
                    {footer}
                </footer>
            )}
        </Component>
    );
};

export default Card;
