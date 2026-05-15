import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { useFetch } from '@/hooks/useFetch';
import { useLanguage } from '@/hooks/useLanguage';
import './SearchBar.css';

/**
 * SearchBar molecule with Smart Suggestions and Debt Status.
 * Architectural Note: Uses useFetch for data fetching and Button atom for UI.
 */
const SearchBar = ({ value, onChange, placeholder, onSelect, className = '' }) => {
    const { t } = useLanguage();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Fetch smart suggestions using architectural standard useFetch
    const { data: suggestions, refetch: fetchSuggestions } = useFetch('/users/search/suggestions', {
        immediate: false,
        initialData: []
    });

    // Load suggestions when focused and empty
    const openSuggestionsOnFocus = () => {
        if (!value) {
            fetchSuggestions();
            setShowSuggestions(true);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClearSearch = () => {
        onChange({ target: { value: '' } });
        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (item) => {
        if (onSelect) {
            onSelect(item);
        } else {
            onChange({ target: { value: item.label } });
        }
        setShowSuggestions(false);
    };

    return (
        <div className={`search-box ${className}`} ref={wrapperRef}>
            <div className="search-box__wrapper">
                <span className="search-box__icon">
                    <Icon name="search" />
                </span>
                <input
                    type="text"
                    placeholder={placeholder || t('search_placeholder')}
                    className="search-box__input"
                    value={value}
                    onChange={onChange}
                    onFocus={openSuggestionsOnFocus}
                    autoComplete="off"
                />
                {value && (
                    <div className="search-box__actions">
                        <Button 
                            variant="ghost" 
                            size="sm-compact"
                            onClick={handleClearSearch}
                            icon={<Icon name="close" />}
                            title={t('clear_search')}
                        />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && !value && (
                <div className="search-box__suggestions">
                    <header className="search-box__suggestions-header">
                        <Icon name="history" /> {t('recent_activity')}
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
                                            title={t(`debt_status_${item.debt_status}`)}
                                            role="status"
                                            aria-label={t(`debt_status_${item.debt_status}`)}
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
