import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { LiveClock } from '@/components/atoms/LiveClock';
import styles from './PageHeader.module.css';

/**
 * PageHeader Organism.
 * Pure UI component for the clinical header.
 */
export const PageHeader = ({
    title,
    actionSlot,
    divider = false,
    className = '',
    variant = 'standard',
    backgroundUrl: _backgroundUrl,
    hideTitle = false,
    hideClock = false,
    hideSearch = false,
    searchTerm = '',
    onSearchChange = () => {},
    statsSlot = null,
    doctorSelectorSlot = null,
    labels = {
        searchPlaceholder: 'Search...'
    }
}) => {
    const isPremium = variant === 'premium';

    // Standard variant
    if (!isPremium) {
        return (
            <header className={`${styles.PageHeader__root} ${divider ? styles.PageHeader__divider : ''} ${className} animate-fade-in`}>
                <div className={`${styles.PageHeader__content}`}>
                    <div className={`${styles.PageHeader__titleContainer}`}>
                        {!hideTitle && <h1 className={`${styles.PageHeader__title}`}>{title}</h1>}
                    </div>
                    {actionSlot && (
                        <div className={`${styles.PageHeader__actions}`}>
                            {actionSlot}
                        </div>
                    )}
                </div>
            </header>
        );
    }

    // Premium variant
    return (
        <header className={`${styles.PageHeader__root} ${styles.PageHeader__premium} ${className} animate-fade-in`}>


            <div className={`${styles.PageHeader__content}`}>
                {/* UTILITIES ROW: Search + Clock + Stats + Actions */}
                <div className={`${styles.PageHeader__utilities}`}>
                    {!hideSearch && (
                        <div className={`${styles.PageHeader__searchContainer}`}>
                            <Icon name="search" size="1rem" className={`${styles.PageHeader__searchIcon}`} />
                            <Input
                                type="text"
                                className={`${styles['PageHeader__searchInput--input']}`}
                                placeholder={labels.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e?.target ? e.target.value : e)}
                            />
                        </div>
                    )}

                    <div className={`${styles.PageHeader__center}`}>
                        {doctorSelectorSlot && (
                            <div className={`${styles.PageHeader__inlineSelectors}`}>
                                {doctorSelectorSlot}
                            </div>
                        )}
                        {!hideClock && <LiveClock hideDate={!!doctorSelectorSlot} premium />}
                    </div>

                    <div className={`${styles.PageHeader__statsContainer}`}>
                        {statsSlot}
                        {actionSlot && <div className="page-header__extra-actions">{actionSlot}</div>}
                    </div>
                </div>

            </div>
        </header>
    );
};

