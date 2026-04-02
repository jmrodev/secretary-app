import React from 'react';
import './PageHeader.css';

/**
 * PageHeader Molecule (Layout Component).
 * Standardizes headings across all dashboard pages.
 * Supports a main title, an optional subtitle, and an action slot (for buttons, selectors, etc).
 */
const PageHeader = ({ 
    title, 
    subtitle, 
    children, 
    divider = false,
    className = ''
}) => {
    const baseClass = 'page-header';
    const dividerClass = divider ? `${baseClass}--divider` : '';

    return (
        <header className={`${baseClass} ${dividerClass} ${className} animate-fadeIn`}>
            <div className={`${baseClass}__title-container`}>
                <h1 className={`${baseClass}__title`}>{title}</h1>
                {subtitle && <p className={`${baseClass}__subtitle`}>{subtitle}</p>}
            </div>
            {children && (
                <div className={`${baseClass}__actions`}>
                    {children}
                </div>
            )}
        </header>
    );
};

export default PageHeader;
