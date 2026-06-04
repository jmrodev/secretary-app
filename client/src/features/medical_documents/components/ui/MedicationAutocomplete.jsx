import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/atoms/Loading';
import styles from './MedicationAutocomplete.module.css';

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

    const baseClass = styles.root;

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
                {chunks.map((chunk, i) => {
                    // Use a more stable key by combining index and content
                    const chunkKey = `chunk-${i}-${chunk.length}`;
                    return regex.test(chunk) ? (
                        <span key={chunkKey} className={`${baseClass}__highlight`}>{chunk}</span>
                    ) : (
                        <React.Fragment key={chunkKey}>{chunk}</React.Fragment>
                    );
                })}
            </>
        );
    };

    return (
        <div className={`${styles.animateFadeIn} ${styles.root} ${className}`} ref={wrapperRef}>
            <div className={styles.inputWrapper}>
                <Input
                    className={styles.input}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('search_medication')}
                    autoComplete="off"
                    size="sm"
                    style={{ minHeight: '30px' }}
                />
                <div className={styles.actions}>
                    {loading ? (
                        <Loading size="sm" variant="inline" />
                    ) : searchTerm ? (
                        <Button
                            type="button"
                            onClick={handleClear}
                            aria-label={t('clear')}
                            tabIndex="-1"
                            unstyled
                            icon={<Icon name="close" />}
                        >
                        </Button>
                    ) : (
                        <span className={styles.icon}>
                            <Icon name="search" />
                        </span>
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul ref={listRef} className={`${styles.animateFadeIn} ${baseClass}__list`} role="listbox">
                    {suggestions.map((med, idx) => (
                        <li
                            key={med.id || `med-suggestion-${idx}`}
                            className={`${baseClass}__item ${cursor === idx ? `${baseClass}__item--active` : ''}`}
                            onClick={() => handleSelect(med)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelect(med);
                                }
                            }}
                            onMouseEnter={() => setCursor(idx)}
                            role="option"
                            aria-selected={cursor === idx}
                            tabIndex={0}
                        >
                            <div className={`${baseClass}__item-title`}>
                                {highlightMatch(med.name, searchTerm)}
                            </div>
                            <div className={`${baseClass}__item-subtitle`}>
                                {med.presentation && (
                                    <span style={{ color: 'rgb(255 255 255 / 70%)', fontStyle: 'italic', marginRight: '0.25rem' }}>
                                        {med.presentation}
                                    </span>
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
                            {suggestions.length} {t('results')}
                        </span>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default MedicationAutocomplete;
