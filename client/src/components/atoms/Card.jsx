import React from 'react';

const Card = ({ children, className = '', title = '', footer = null }) => {
    return (
        <div className={`card ${className}`}>
            {title && (
                <div className="card-header mb-4">
                    <h3 className="font-bold text-lg text-main-900">{title}</h3>
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
            {footer && (
                <div className="card-footer mt-6 pt-4 border-t border-divider">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
