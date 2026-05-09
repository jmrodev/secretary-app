import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { useFetch } from '@/hooks/useFetch';
import { useLanguage } from '@/context/LanguageContext';
import './SearchBar.css';

/**
 * SearchBar molecule with Smart Suggestions and Debt Status.
 * Architectural Note: Uses useFetch for data fetching and Button atom for UI.
 */
const SearchBar = ({ value, onChange, placeholder, onSelect, className = '' }) => {
    const { t } = useLanguage();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Fetch recent patients using architectural standard useFetch
    const { data: suggestionsData, loading, refetch: fetchRecent } = useFetch('/users/patients/recent', {
        immediate: false,
        initialData: { patients: [] }
    });

    const suggestions = suggestionsData?.patients || [];

    // Load recent patients when focused and empty
    const handleFocus = () => {
        if (!value) {
            fetchRecent();
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

    const handleClear = () => {
        onChange({ target: { value: '' } });
        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (patient) => {
        if (onSelect) {
            onSelect(patient);
        } else {
            onChange({ target: { value: patient.full_name } });
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
                    onFocus={handleFocus}
                    autoComplete="off"
                />
                {value && (
                    <div className="search-box__actions">
                        <Button 
                            variant="ghost" 
                            size="sm-compact"
                            onClick={handleClear}
                            icon={<Icon name="close" />}
                            title={t('clear_search')}
                        />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && !value && (
                <div className="search-box__suggestions">
                    <header className="search-box__suggestions-header">
                        <Icon name="history" /> {t('recent_suggestions')}
                    </header>
                    <ul className="search-box__suggestions-list">
                        {suggestions.map(patient => (
                            <li 
                                key={patient.id} 
                                className="search-box__suggestion-item"
                                onClick={() => handleSelectSuggestion(patient)}
                            >
                                <div className="search-box__suggestion-info">
                                    <span className="search-box__suggestion-name">
                                        {patient.full_name}
                                    </span>
                                    <span className="search-box__suggestion-dni">
                                        {patient.dni}
                                    </span>
                                </div>
                                
                                {patient.debt_status && (
                                    <div 
                                        className={`search-box__suggestion-status search-box__suggestion-status--${patient.debt_status}`}
                                        title={t(`debt_status_${patient.debt_status}`)}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
