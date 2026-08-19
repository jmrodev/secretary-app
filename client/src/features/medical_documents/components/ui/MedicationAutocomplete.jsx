import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Loading } from '@/components/atoms/Loading';
import styles from './MedicationAutocomplete.module.css';

/**
 * MedicationAutocomplete Feature Molecule.
 * Search bar with live suggestions from the medical vademecum.
 * Part of the prescription and medical request management workflow.
 */
export const MedicationAutocomplete = ({
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

        // Stable key without array index: hash of chunk content + running counter
        let chunkCounter = 0;
        const makeChunkKey = (chunk) => {
            let h = 5381;
            for (let k = 0; k < chunk.length; k++) {
                h = ((h << 5) + h) ^ chunk.charCodeAt(k);
            }
            return `chunk-${chunkCounter++}-${h >>> 0}`;
        };

        return (
            <>
                {chunks.map((chunk) => {
                    const chunkKey = makeChunkKey(chunk);
                    return regex.test(chunk) ? (
                        <span key={chunkKey} className={styles.MedicationAutocomplete__highlight}>{chunk}</span>
                    ) : (
                        <React.Fragment key={chunkKey}>{chunk}</React.Fragment>
                    );
                })}
            </>
        );
    };

    return (
        <div className={`${styles.MedicationAutocomplete__animateFadeIn} ${styles.MedicationAutocomplete__root} ${className}`} ref={wrapperRef}>
            <div className={styles.MedicationAutocomplete__inputWrapper}>
                <Input
                    className={styles.MedicationAutocomplete__input}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('search_medication')}
                    autoComplete="off"
                    size="sm"
                    style={{ minHeight: '30px' }}
                />
                <div className={styles.MedicationAutocomplete__actions}>
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
                <ul ref={listRef} className={`${styles.MedicationAutocomplete__animateFadeIn} ${styles.MedicationAutocomplete__list}`} role="listbox">
                    {suggestions.map((med, idx) => (
                        <li
                            key={med.id}
                            className={`${styles.MedicationAutocomplete__item} ${cursor === idx ? styles.MedicationAutocomplete__itemActive : ''}`}
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
                            <div className={styles.MedicationAutocomplete__itemTitle}>
                                {highlightMatch(med.name, searchTerm)}
                            </div>
                            <div className={styles.MedicationAutocomplete__itemSubtitle}>
                                {med.presentation && (
                                    <span style={{ color: 'rgb(255 255 255 / 70%)', fontStyle: 'italic', marginRight: '0.25rem' }}>
                                        {med.presentation}
                                    </span>
                                )}
                                <span>{highlightMatch(med.drug, searchTerm)}</span>
                                {med.lab && (
                                    <>
                                        <span className={styles.separator}>•</span>
                                        <span className={styles.lab}>{highlightMatch(med.lab, searchTerm)}</span>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                    <li className={styles.MedicationAutocomplete__footer}>
                        <span className={styles.MedicationAutocomplete__footerBrand}>{t('iosfa_vademecum')}</span>
                        <span className={styles.footerCount}>
                            {suggestions.length} {t('results')}
                        </span>
                    </li>
                </ul>
            )}
        </div>
    );
};

