import React from 'react';
import { DoctorSelector } from '@/features/doctors';
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
    className = '',
    variant = 'standard', // 'standard' or 'premium'
    backgroundUrl, // Optional background for premium variant
    hideDoctorSelector = false // NEW: Allows disabling global selector
}) => {
    const isPremium = variant === 'premium';
    const baseClass = isPremium ? 'page-header--premium' : 'page-header';
    const dividerClass = divider ? 'page-header--divider' : '';

    return (
        <header className={`${baseClass} ${dividerClass} ${className} animate-fadeIn`}>
            {isPremium && backgroundUrl && (
                <img 
                    src={backgroundUrl} 
                    alt="" 
                    className="page-header__background-img" 
                />
            )}

            
            <div className={`${baseClass}__content`}>
                <div className={`${baseClass}__title-container`}>
                    <h1 className={`${baseClass}__title`}>{title}</h1>
                    {subtitle && (
                        <div className={`${baseClass}__subtitle`}>
                            {subtitle}
                            {isPremium && !hideDoctorSelector && (
                                <DoctorSelector />
                            )}
                        </div>
                    )}
                </div>
                {children && (
                    <div className={`${baseClass}__actions`}>
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
