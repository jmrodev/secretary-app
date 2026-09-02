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
    preset = 'full', // 'full' (1800px) | 'contained' (960px)
    wide: _wide,
    flush: _flush,
    title,
    subtitle = null,
    variant: _variant,
    backgroundUrl: _backgroundUrl,
    hideDoctorSelector = false,
    doctorSelectorActions = null,
    actionSlot,
    statsSlot = null,
    hideClock = false,
    hideSearch = false,
    hideTitle = false,
    noAnimation = false
}) => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { t } = useLanguage();

    const presetClass = styles[`MainLayout__pageShell--${preset}`] || styles['MainLayout__pageShell--full'];
    const shellClassName = `${styles.MainLayout__pageShell} ${presetClass} ${!noAnimation ? sharedStyles.AnimateFadeIn : ''}`.trim();

    return (
        <div className={`${styles.MainLayout__appLayout}`}>
            <Navbar />
            <main className={`${styles.MainLayout__root}`}>
                {title && (
                    <PageHeader 
                        title={title}
                        subtitle={subtitle}
                        actionSlot={actionSlot}
                        statsSlot={statsSlot}
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
                <div className={shellClassName}>
                    {children}
                </div>
            </main>
        </div>
    );
};
