import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/api/axios';

/**
 * Custom hook to handle medication autocomplete logic.
 * 
 * @param {string} initialValue - Initial search term
 * @param {Function} onChange - Callback for search term changes
 * @param {Function} onSelectMedication - Callback for medication selection
 * @returns {Object} - State and handlers for autocomplete
 */
export const useMedicationAutocomplete = (initialValue = '', onChange, onSelectMedication) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(-1);
    const debounceTimer = useRef(null);

    useEffect(() => {
        setSearchTerm(initialValue || '');
    }, [initialValue]);

    const fetchSuggestions = useCallback(async (text) => {
        if (text.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/medical/vademecum/search?q=${encodeURIComponent(text)}`);
            setSuggestions(res.data);
            setShowSuggestions(res.data.length > 0);
            setCursor(-1);
        } catch (err) {
            console.error("Error fetching med suggestions:", err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (text) => {
        setSearchTerm(text);
        if (onChange) onChange(text);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(text);
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
        setSuggestions([]);
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
