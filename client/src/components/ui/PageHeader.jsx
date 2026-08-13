import React from 'react';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import LiveClock from '@/components/atoms/LiveClock';
import styles from './PageHeader.module.css';

/**
 * PageHeader Organism.
 * Pure UI component for the clinical header.
 */
const PageHeader = ({
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
            <header className={`${styles.root} ${divider ? styles.divider : ''} ${className} animate-fade-in`}>
                <div className={`${styles.content}`}>
                    <div className={`${styles.titleContainer}`}>
                        {!hideTitle && <h1 className={`${styles.title}`}>{title}</h1>}
                    </div>
                    {actionSlot && (
                        <div className={`${styles.actions}`}>
                            {actionSlot}
                        </div>
                    )}
                </div>
            </header>
        );
    }

    // Premium variant
    return (
        <header className={`${styles.root} ${styles.premium} ${className} animate-fade-in`}>


            <div className={`${styles.content}`}>
                {/* UTILITIES ROW: Search + Clock + Stats + Actions */}
                <div className={`${styles.utilities}`}>
                    {!hideSearch && (
                        <div className={`${styles.searchContainer}`}>
                            <Icon name="search" size="1rem" className={`${styles.searchIcon}`} />
                            <Input
                                type="text"
                                className={`${styles.searchInput}`}
                                placeholder={labels.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e?.target ? e.target.value : e)}
                            />
                        </div>
                    )}

                    <div className={`${styles.center}`}>
                        {doctorSelectorSlot && (
                            <div className={`${styles.inlineSelectors}`}>
                                {doctorSelectorSlot}
                            </div>
                        )}
                        {!hideClock && <LiveClock hideDate={!!doctorSelectorSlot} premium />}
                    </div>

                    <div className={`${styles.statsContainer}`}>
                        {statsSlot}
                        {actionSlot && <div className="page-header__extra-actions">{actionSlot}</div>}
                    </div>
                </div>

            </div>
        </header>
    );
};

export default PageHeader;
