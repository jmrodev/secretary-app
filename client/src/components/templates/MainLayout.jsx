import React from 'react';
import { Navbar } from '@/features/layout';
import PageHeader from '@/components/ui/PageHeader';
import { useSearch } from '@/hooks/useSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { DoctorSelector } from '@/features/doctors';
import CompactHeaderStats from '@/components/molecules/CompactHeaderStats';
import styles from './MainLayout.module.css';

/**
 * MainLayout Template.
 * Orchestrates the primary application structure: Navbar + PageHeader + Content.
 */
export const MainLayout = ({ 
    children, 
    wide = false, 
    flush = false,
    title,
    variant = 'premium',
    backgroundUrl,
    hideDoctorSelector = false,
    doctorSelectorActions = null,
    actionSlot,
    hideClock = false,
    hideSearch = false,
    hideTitle = (variant === 'premium'),
    noAnimation = false
}) => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { t } = useLanguage();

    return (
        <div className={`${styles.MainLayout__appLayout}`}>
            <Navbar />
            <main className={`${styles.MainLayout__root} ${wide ? styles['MainLayout--dashboardWide'] : ''} ${flush ? styles['MainLayout--flush'] : ''}`}>
                {title && (
                    <PageHeader 
                        title={title}
                        variant={variant}
                        backgroundUrl={backgroundUrl}
                        actionSlot={actionSlot}
                        hideTitle={hideTitle}
                        hideClock={hideClock}
                        hideSearch={hideSearch}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        statsSlot={<CompactHeaderStats />}
                        doctorSelectorSlot={
                            !hideDoctorSelector ? (
                                <>
                                    <DoctorSelector />
                                    {doctorSelectorActions}
                                </>
                            ) : null
                        }
                        labels={{
                            searchPlaceholder: t('search_placeholder') || 'Search...'
                        }}
                    />
                )}
                <div className={`layout-content-area ${!noAnimation ? 'animate-fade-in' : ''} ${styles.MainLayout__pageShell}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};
