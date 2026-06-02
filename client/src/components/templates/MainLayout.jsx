import React from 'react';
import { Navbar } from '@/features/layout';
import PageHeader from '@/components/ui/PageHeader';
import { useSearch } from '@/hooks/useSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { DoctorSelector } from '@/features/doctors';
import CompactHeaderStats from '@/components/molecules/CompactHeaderStats';
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
    const { searchTerm, setSearchTerm } = useSearch();
    const { t } = useLanguage();

    return (
        <div className="app-layout">
            <Navbar />
            <main className={`main-content ${wide ? 'dashboard-wide' : ''} ${flush ? 'main-content--flush' : ''}`}>
                {title && (
                    <PageHeader 
                        title={title}
                        variant={variant}
                        backgroundUrl={backgroundUrl}
                        actionSlot={actionSlot}
                        hideTitle={hideTitle}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        statsSlot={<CompactHeaderStats />}
                        doctorSelectorSlot={!hideDoctorSelector ? <DoctorSelector /> : null}
                        labels={{
                            searchPlaceholder: t('search_placeholder') || 'Search...'
                        }}
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
