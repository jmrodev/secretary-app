import React, { useEffect, useRef } from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import styles from './SearchBar.module.css';

const EMPTY_ARRAY = [];
const DEFAULT_LABELS = {
    placeholder: 'Search...',
    clearSearch: 'Clear search',
    recentActivity: 'Recent activity',
    debtStatusPrefix: 'Status:'
};

/**
 * SearchBar UI Component
 * Pure component for displaying a search bar with optional suggestions.
 */
export const SearchBar = ({ 
    value, 
    onChange, 
    placeholder, 
    onSelect, 
    className = '',
    suggestions = EMPTY_ARRAY,
    showSuggestions = false,
    onFocus,
    onKeyDown,
    onClear,
    onCloseSuggestions,
    labels = DEFAULT_LABELS
}) => {
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                if (onCloseSuggestions) onCloseSuggestions();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onCloseSuggestions]);

    const handleClearSearch = () => {
        if (onClear) onClear();
    };

    const handleSelectSuggestion = (item) => {
        if (onSelect) {
            onSelect(item);
        } else {
            onChange({ target: { value: item.label } });
            if (onCloseSuggestions) onCloseSuggestions();
        }
    };

    return (
        <div className={`${styles.SearchBar__root} ${className}`} ref={wrapperRef}>
            <div className={`${styles.SearchBar__wrapper}`}>
                <span className={`${styles.SearchBar__icon}`}>
                    <Icon name="search" />
                </span>
                <input
                    type="text"
                    placeholder={placeholder || labels.placeholder}
                    className={`${styles.SearchBar__input}`}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    autoComplete="off"
                />
                {value && (
                    <div className={`${styles.SearchBar__actions}`}>
                        <Button 
                            variant="ghost" 
                            size="sm-compact"
                            onClick={handleClearSearch}
                            icon={<Icon name="close" />}
                            title={labels.clearSearch}
                        />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && !value && (
                <div className={`${styles.SearchBar__suggestions}`}>
                    <header className={`${styles.SearchBar__suggestionsHeader}`}>
                        <Icon name="history" /> {labels.recentActivity}
                    </header>
                    <ul className={`${styles.SearchBar__suggestionsList}`} role="listbox">
                        {suggestions.map((item) => {
                            const itemKey = `${item.type}-${item.id}`;
                            const handleKeyDown = (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelectSuggestion(item);
                                }
                            };

                            return (
                                <li 
                                    key={itemKey} 
                                    className={`${styles.SearchBar__suggestionItem}`}
                                    onClick={() => handleSelectSuggestion(item)}
                                    onKeyDown={handleKeyDown}
                                    role="option"
                                    aria-selected="false"
                                    tabIndex={0}
                                >
                                    <div className={styles.SearchBar__suggestionIcon}>
                                        <Icon name={item.type === 'patient' ? 'person' : 'calendar_today'} />
                                    </div>
                                    <div className={`${styles.SearchBar__suggestionInfo}`}>
                                        <span className={`${styles.SearchBar__suggestionName}`}>
                                            {item.label}
                                        </span>
                                        <span className={`${styles.SearchBar__suggestionDni}`}>
                                            {item.sublabel}
                                        </span>
                                    </div>
                                    
                                    {item.debt_status && (
                                        <div 
                                            className={`${styles.SearchBar__suggestionStatus} ${styles[`SearchBar__suggestionStatus${item.debt_status.charAt(0).toUpperCase() + item.debt_status.slice(1).toLowerCase()}`] || ''}`}
                                            title={`${labels.debtStatusPrefix} ${item.debt_status}`}
                                            role="status"
                                            aria-label={`${labels.debtStatusPrefix} ${item.debt_status}`}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

