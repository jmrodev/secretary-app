import React from 'react';
import './Header.css';

const Header = ({ title, subtitle, actions }) => {
    return (
        <header className="dashboard-header animate-fadeIn">
            <div className="flex-1">
                <h1 className="dashboard-header__title">{title}</h1>
                {subtitle && <p className="dashboard-header__subtitle">{subtitle}</p>}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </header>
    );
};

export default Header;
