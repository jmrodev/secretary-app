import React from 'react';
import { Navbar } from '@/features/layout';
import PageHeader from '@/components/ui/PageHeader';
import { useSearch } from '@/hooks/useSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { DoctorSelector } from '@/features/doctors';
import CompactHeaderStats from '@/components/molecules/CompactHeaderStats';
import { PendingApprovalProvider } from '@/context/PendingApprovalContext';
import { PendingApprovalQueue } from '@/features/communication/components/PendingApprovalQueue';
import styles from './MainLayout.module.css';

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
    doctorSelectorActions = null,
    actionSlot,
    hideClock = false,
    hideSearch = false,
    hideTitle = (variant === 'premium')
}) => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { t } = useLanguage();

    return (
        <PendingApprovalProvider>
            <div className={`${styles.appLayout}`}>
                <Navbar />
                <main className={`${styles.root} ${wide ? styles.dashboardWide : ''} ${flush ? styles.flush : ''}`}>
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
                    <div className={`${styles.inner}`}>
                        {children}
                    </div>
                </main>
            </div>
            {/* Global pending-approval queue (visible from every page, non-blocking) */}
            <PendingApprovalQueue />
        </PendingApprovalProvider>
    );
};

export default MainLayout;
