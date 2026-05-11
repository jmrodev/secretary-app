import React from 'react';
import './Card.css';

const Card = ({ children, className = '', title = '', footer = null, noPadding = false, as: Component = 'section' }) => {
    const baseClass = 'card';
    const combinedClasses = [
        baseClass,
        noPadding ? `${baseClass}--no-padding` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Component className={combinedClasses}>
            {title && (
                <header className={`${baseClass}__header`}>
                    {typeof title === 'string' ? (
                        <h3 className={`${baseClass}__title`}>{title}</h3>
                    ) : (
                        title
                    )}
                </header>
            )}
            <div className={`${baseClass}__content`}>
                {children}
            </div>
            {footer && (
                <footer className={`${baseClass}__footer`}>
                    {footer}
                </footer>
            )}
        </Component>
    );
};

export default Card;
