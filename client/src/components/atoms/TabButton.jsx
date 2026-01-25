import React from 'react';

const TabButton = ({
    children,
    isActive,
    onClick,
    variant = 'underline', // 'underline' | 'pill'
    activeColor = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'default'
    className = ''
}) => {
    // Base class from global CSS
    const baseClass = 'tab-btn';

    if (variant === 'underline') {
        const colorClasses = {
            blue: 'border-blue-600 text-blue-700',
            purple: 'border-purple-600 text-purple-700',
            green: 'border-green-600 text-green-700',
            amber: 'border-amber-600 text-amber-700',
            default: 'border-slate-600 text-slate-700'
        };

        const activeStyles = isActive
            ? `${colorClasses[activeColor] || colorClasses.default}`
            : 'border-transparent text-slate-500 hover:text-slate-700';

        // Note: 'rounded-none' is added to ensure the bottom border looks correct and not curved at corners if that was the issue, 
        // but 'SystemConfig' didn't have it. 'tab-btn' has border-radius: 8px.
        // I will just append the classes used in SystemConfig. 
        // The original code was: `tab-btn px-6 py-3 font-medium transition-colors border-b-2 ...`

        return (
            <button
                className={`${baseClass} px-6 py-3 font-medium transition-colors border-b-2 ${activeStyles} ${className}`}
                onClick={onClick}
            >
                {children}
            </button>
        );
    }

    // Default 'pill' variant (using global CSS .tab-btn.active)
    return (
        <button
            className={`${baseClass} ${isActive ? 'active' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default TabButton;
