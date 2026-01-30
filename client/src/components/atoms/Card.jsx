import React from 'react';
import './Card.css';

const Card = ({ children, className = '', title = '', footer = null }) => {
    const baseClass = 'card';

    return (
        <div className={`${baseClass} ${className}`}>
            {title && (
                <div className={`${baseClass}__header`}>
                    <h3 className={`${baseClass}__title`}>{title}</h3>
                </div>
            )}
            <div className={`${baseClass}__content`}>
                {children}
            </div>
            {footer && (
                <div className={`${baseClass}__footer`}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
