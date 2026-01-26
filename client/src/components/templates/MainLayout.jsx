import React from 'react';
import Sidebar from '../organisms/Sidebar';

const MainLayout = ({ title, subtitle, children, actions }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {(title || subtitle) && (
                    <header className="page-header">
                        <div className="page-header__info">
                            {title && <h1 className="page-header__title">{title}</h1>}
                            {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
                        </div>
                        {actions && (
                            <div className="page-header__actions">
                                {actions}
                            </div>
                        )}
                    </header>
                )}

                {children}
            </main>
        </div>
    );
};

export default MainLayout;
