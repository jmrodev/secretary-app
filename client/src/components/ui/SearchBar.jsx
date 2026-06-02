import React, { useEffect, useRef } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import './SearchBar.css';

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
    suggestions = [],
    showSuggestions = false,
    onFocus,
    onClear,
    onCloseSuggestions,
    labels = {
        placeholder: 'Search...',
        clearSearch: 'Clear search',
        recentActivity: 'Recent activity',
        debtStatusPrefix: 'Status:'
    }
}) => {
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                onCloseSuggestions && onCloseSuggestions();
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
            onCloseSuggestions && onCloseSuggestions();
        }
    };

    return (
        <div className={`search-box ${className}`} ref={wrapperRef}>
            <div className="search-box__wrapper">
                <span className="search-box__icon">
                    <Icon name="search" />
                </span>
                <input
                    type="text"
                    placeholder={placeholder || labels.placeholder}
                    className="search-box__input"
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    autoComplete="off"
                />
                {value && (
                    <div className="search-box__actions">
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
                <div className="search-box__suggestions">
                    <header className="search-box__suggestions-header">
                        <Icon name="history" /> {labels.recentActivity}
                    </header>
                    <ul className="search-box__suggestions-list" role="listbox">
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
                                    className="search-box__suggestion-item"
                                    onClick={() => handleSelectSuggestion(item)}
                                    onKeyDown={handleKeyDown}
                                    role="option"
                                    aria-selected="false"
                                    tabIndex={0}
                                >
                                    <div className="search-box__suggestion-icon">
                                        <Icon name={item.type === 'patient' ? 'person' : 'calendar_today'} />
                                    </div>
                                    <div className="search-box__suggestion-info">
                                        <span className="search-box__suggestion-name">
                                            {item.label}
                                        </span>
                                        <span className="search-box__suggestion-dni">
                                            {item.sublabel}
                                        </span>
                                    </div>
                                    
                                    {item.debt_status && (
                                        <div 
                                            className={`search-box__suggestion-status search-box__suggestion-status--${item.debt_status}`}
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
