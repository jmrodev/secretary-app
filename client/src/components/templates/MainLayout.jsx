import React from 'react';
import { Navbar } from '@/features/layout';
import PageHeader from '@/components/organisms/PageHeader';
import './MainLayout.css';

/**
 * MainLayout Template.
 * Orchestrates the primary application structure: Navbar + PageHeader + Content.
 */
const MainLayout = ({ 
    children, 
    wide = false, 
    flush = false,
    title,
    variant = 'premium',
    backgroundUrl,
    hideDoctorSelector = false,
    actionSlot,
    hideTitle = (variant === 'premium')
}) => {
    return (
        <div className="app-layout">
            <Navbar />
            <main className={`main-content ${wide ? 'dashboard-wide' : ''} ${flush ? 'main-content--flush' : ''}`}>
                {title && (
                    <PageHeader 
                        title={title}
                        variant={variant}
                        backgroundUrl={backgroundUrl}
                        hideDoctorSelector={hideDoctorSelector}
                        actionSlot={actionSlot}
                        hideTitle={hideTitle}
                    />
                )}
                <div className="main-content__inner">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
