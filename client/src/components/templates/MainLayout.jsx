import React from 'react';
import { Sidebar, PageHeader } from '@/features/layout';
import './MainLayout.css';

/**
 * MainLayout Template.
 * Orchestrates the primary application structure: Sidebar + PageHeader + Content.
 */
const MainLayout = ({ 
    children, 
    wide = false, 
    flush = false,
    title,
    variant = 'premium',
    backgroundUrl,
    hideDoctorSelector = false,
    headerActions
}) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className={`main-content ${wide ? 'dashboard-wide' : ''} ${flush ? 'main-content--flush' : ''}`}>
                {title && (
                    <PageHeader 
                        title={title}
                        variant={variant}
                        backgroundUrl={backgroundUrl}
                        hideDoctorSelector={hideDoctorSelector}
                        actionSlot={headerActions}
                    />
                )}
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
