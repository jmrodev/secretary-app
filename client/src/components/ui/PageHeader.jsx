import React from 'react';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import LiveClock from '@/components/atoms/LiveClock';
import defaultHeroBg from '@/features/dashboard/assets/dashboard_hero.png';
import './PageHeader.css';

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
    backgroundUrl,
    hideTitle = false,
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
            <header className={`page-header ${divider ? 'page-header--divider' : ''} ${className} animate-fade-in`}>
                <div className="page-header__content">
                    <div className="page-header__title-container">
                        {!hideTitle && <h1 className="page-header__title">{title}</h1>}
                    </div>
                    {actionSlot && (
                        <div className="page-header__actions">
                            {actionSlot}
                        </div>
                    )}
                </div>
            </header>
        );
    }

    const resolvedBg = backgroundUrl || defaultHeroBg;

    // Premium variant
    return (
        <header className={`page-header page-header--premium ${className} animate-fade-in`}>
            <img
                src={resolvedBg}
                alt=""
                className="page-header__background"
                aria-hidden="true"
            />

            <div className="page-header__content">
                {/* UTILITIES ROW: Search + Clock + Stats + Actions */}
                <div className="page-header__utilities">
                    <div className="page-header__search-container">
                        <Icon name="SEARCH" size="1rem" className="page-header__search-icon" />
                        <Input
                            type="text"
                            className="page-header__search-input"
                            placeholder={labels.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="page-header__center">
                        <LiveClock className="live-clock--premium" />
                    </div>

                    <div className="page-header__stats-container">
                        {statsSlot}
                        {actionSlot && <div className="page-header__extra-actions">{actionSlot}</div>}
                    </div>
                </div>

                {/* SELECTOR ROW: Dedicated row for Doctor context */}
                {doctorSelectorSlot && (
                    <div className="page-header__selectors">
                        {doctorSelectorSlot}
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
