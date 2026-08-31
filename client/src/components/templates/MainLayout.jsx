import React from 'react';
import { Navbar } from '@/features/layout/components/Navbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSearch } from '@/hooks/useSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { DoctorSelector } from '@/features/doctors/components/ui/DoctorSelector';
import sharedStyles from '@/styles/shared.module.css';
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
            <main className={`${styles.MainLayout__root} ${wide ? styles['MainLayout__root--dashboardWide'] : ''} ${flush ? styles['MainLayout__root--flush'] : ''}`}>
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
                        doctorSelectorSlot={
                            !hideDoctorSelector ? (
                                <>
                                    <DoctorSelector />
                                    {doctorSelectorActions}
                                </>
                            ) : null
                        }
                        labels={{
                            searchPlaceholder: t('search_placeholder')
                        }}
                    />
                )}
                <div className={`${styles.MainLayout__pageShell} ${!noAnimation ? sharedStyles.AnimateFadeIn : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};
