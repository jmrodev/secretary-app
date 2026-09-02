import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { LiveClock } from '@/components/atoms/LiveClock';
import sharedStyles from '@/styles/shared.module.css';
import styles from './PageHeader.module.css';

/**
 * PageHeader Organism.
 * Clean, modern, minimalist 1-row header for all application views.
 */
export const PageHeader = ({
    title,
    subtitle = null,
    actionSlot = null,
    statsSlot = null,
    doctorSelectorSlot = null,
    className = '',
    hideTitle = false,
    hideClock = false,
    hideSearch = false,
    searchTerm = '',
    onSearchChange = () => {},
    labels = {
        searchPlaceholder: 'Search...'
    }
}) => {
    return (
        <header className={`${styles.PageHeader__root} ${className} ${sharedStyles.AnimateFadeIn}`}>
            <div className={`${styles.PageHeader__content}`}>
                {/* LEFT: Title & Subtitle */}
                {!hideTitle && title && (
                    <div className={`${styles.PageHeader__left}`}>
                        <h1 className={`${styles.PageHeader__title}`}>{title}</h1>
                        {subtitle && <span className={`${styles.PageHeader__subtitle}`}>{subtitle}</span>}
                    </div>
                )}

                {/* CENTER: Search Bar & Inline Doctor Selector */}
                {(!hideSearch || doctorSelectorSlot) && (
                    <div className={`${styles.PageHeader__center}`}>
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
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        className={styles.PageHeader__clearSearchBtn}
                                        onClick={() => onSearchChange('')}
                                        title="Limpiar"
                                        icon={<Icon name="close" size="0.85rem" />}
                                    />
                                )}
                            </div>
                        )}
                        {doctorSelectorSlot && (
                            <div className={`${styles.PageHeader__inlineSelectors}`}>
                                {doctorSelectorSlot}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Clock + Stats + Primary Actions */}
                <div className={`${styles.PageHeader__right}`}>
                    {!hideClock && (
                        <div className={`${styles.PageHeader__clockWrapper}`}>
                            <LiveClock hideDate={!!doctorSelectorSlot} premium />
                        </div>
                    )}
                    {statsSlot && (
                        <div className={`${styles.PageHeader__statsSlot}`}>
                            {statsSlot}
                        </div>
                    )}
                    {actionSlot && (
                        <div className={`${styles.PageHeader__actions}`}>
                            {actionSlot}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

