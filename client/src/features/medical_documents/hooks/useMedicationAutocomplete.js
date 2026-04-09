import { useState, useEffect, useRef } from 'react';
import { useFetch } from '@/hooks/useFetch';

/**
 * useMedicationAutocomplete Feature Hook.
 * Logic for fetching and managing medication suggestions from the vademecum.
 */
export const useMedicationAutocomplete = (initialValue = '', onChange, onSelectMedication) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursor, setCursor] = useState(-1);
    const debounceTimer = useRef(null);

    // --- Data Fetching ---
    const { 
        data: suggestions = [], 
        loading, 
        refetch: fetchSuggestions 
    } = useFetch(searchTerm.length >= 2 ? `/medical/vademecum/search?q=${encodeURIComponent(searchTerm)}` : null, {
        initialData: [],
        immediate: false, // We control it with debounce
        onSuccess: (data) => {
            setShowSuggestions(data.length > 0);
            setCursor(-1);
        }
    });

    useEffect(() => {
        setSearchTerm(initialValue || '');
    }, [initialValue]);

    const handleSearch = (text) => {
        setSearchTerm(text);
        if (onChange) onChange(text);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            if (text.length >= 2) {
                fetchSuggestions();
            } else {
                setShowSuggestions(false);
            }
        }, 300);
    };

    const handleSelect = (med) => {
        setSearchTerm(med.full_label);
        if (onChange) onChange(med.full_label);
        setShowSuggestions(false);
        setCursor(-1);
        if (onSelectMedication) onSelectMedication(med);
    };

    const handleClear = () => {
        setSearchTerm('');
        if (onChange) onChange('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (showSuggestions && cursor >= 0 && cursor < suggestions.length) {
                handleSelect(suggestions[cursor]);
            } else if (showSuggestions && suggestions.length > 0) {
                handleSelect(suggestions[0]);
            }
            return;
        }

        if (!showSuggestions) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    return {
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
    };
};
