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
const SearchBar = ({ 
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
        <div className={`${styles.root} ${className}`} ref={wrapperRef}>
            <div className={`${styles.wrapper}`}>
                <span className={`${styles.icon}`}>
                    <Icon name="search" />
                </span>
                <input
                    type="text"
                    placeholder={placeholder || labels.placeholder}
                    className={`${styles.input}`}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    autoComplete="off"
                />
                {value && (
                    <div className={`${styles.actions}`}>
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
                <div className={`${styles.suggestions}`}>
                    <header className={`${styles.suggestionsHeader}`}>
                        <Icon name="history" /> {labels.recentActivity}
                    </header>
                    <ul className={`${styles.suggestionsList}`} role="listbox">
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
                                    className={`${styles.suggestionItem}`}
                                    onClick={() => handleSelectSuggestion(item)}
                                    onKeyDown={handleKeyDown}
                                    role="option"
                                    aria-selected="false"
                                    tabIndex={0}
                                >
                                    <div className="search-box__suggestion-icon">
                                        <Icon name={item.type === 'patient' ? 'person' : 'calendar_today'} />
                                    </div>
                                    <div className={`${styles.suggestionInfo}`}>
                                        <span className={`${styles.suggestionName}`}>
                                            {item.label}
                                        </span>
                                        <span className={`${styles.suggestionDni}`}>
                                            {item.sublabel}
                                        </span>
                                    </div>
                                    
                                    {item.debt_status && (
                                        <div 
                                            className={`${styles.suggestionStatus} search-box__suggestion-status--${item.debt_status}`}
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

export default SearchBar;
