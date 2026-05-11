import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/atoms/Loading';
import './MedicationAutocomplete.css';

/**
 * MedicationAutocomplete Feature Molecule.
 * Search bar with live suggestions from the medical vademecum.
 * Part of the prescription and medical request management workflow.
 */
const MedicationAutocomplete = ({
    value,
    onChange,
    placeholder,
    className = '',
    onSelectMedication
}) => {
    const { t } = useLanguage();
    const wrapperRef = useRef(null);
    const listRef = useRef(null);

    const {
        searchTerm,
        suggestions,
        showSuggestions,
        loading,
        cursor,
        handleSearch,
        handleSelect,
        handleClear,
        handleKeyDown,
        setShowSuggestions,
        setCursor
    } = useMedicationAutocomplete(value, onChange, onSelectMedication);

    const baseClass = 'medication-autocomplete';

    // Handle clicks outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowSuggestions]);

    /**
     * Helper to highlight matching text in suggestions
     */
    const highlightMatch = (text, query) => {
        if (!query || typeof text !== 'string') return text;
        const parts = query.split(/\s+/).filter(q => q.length > 0);
        if (parts.length === 0) return text;

        const regex = new RegExp(`(${parts.join('|')})`, 'gi');
        const chunks = text.split(regex);

        return (
            <>
                {chunks.map((chunk, i) =>
                    regex.test(chunk) ? (
                        <span key={i} className={`${baseClass}__highlight`}>{chunk}</span>
                    ) : (
                        chunk
                    )
                )}
            </>
        );
    };

    return (
        <div className={`${baseClass} ${className} animate-fade-in`} ref={wrapperRef}>
            <div className={`${baseClass}__input-wrapper`}>
                <Input
                    className={`${baseClass}__input`}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('search_medication') || "Buscar medicamento..."}
                    autoComplete="off"
                />
                <div className={`${baseClass}__actions`}>
                    {loading ? (
                        <Loading size="sm" variant="inline" />
                    ) : searchTerm ? (
                        <Button
                            type="button"
                            onClick={handleClear}
                            aria-label={t('clear') || "Limpiar"}
                            tabIndex="-1"
                            unstyled
                            icon={<Icon name="close" />}
                        >
                        </Button>
                    ) : (
                        <span className="medication-autocomplete__icon">
                            <Icon name="search" />
                        </span>
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul ref={listRef} className={`${baseClass}__list animate-fade-in`}>
                    {suggestions.map((med, idx) => (
                        <li
                            key={med.id || idx}
                            className={`${baseClass}__item ${cursor === idx ? `${baseClass}__item--active` : ''}`}
                            onClick={() => handleSelect(med)}
                            onMouseEnter={() => setCursor(idx)}
                        >
                            <div className={`${baseClass}__item-title`}>
                                {highlightMatch(med.name, searchTerm)}
                            </div>
                            <div className={`${baseClass}__item-subtitle`}>
                                {med.presentation && (
                                    <Badge variant="gray" className="badge--sm">
                                        {med.presentation}
                                    </Badge>
                                )}
                                <span>{highlightMatch(med.drug, searchTerm)}</span>
                                {med.lab && (
                                    <>
                                        <span className={`${baseClass}__separator`}>•</span>
                                        <span className={`${baseClass}__lab`}>{highlightMatch(med.lab, searchTerm)}</span>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                    <li className={`${baseClass}__footer`}>
                        <span className={`${baseClass}__footer-brand`}>{t('iosfa_vademecum')}</span>
                        <span className={`${baseClass}__footer-count`}>
                            {suggestions.length} {t('results') || 'resultados'}
                        </span>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default MedicationAutocomplete;
