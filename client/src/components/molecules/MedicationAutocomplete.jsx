import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';

const MedicationAutocomplete = ({ value, onChange, placeholder, className, onSelectMedication }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(-1); // Keyboard navigation cursor
    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (text) => {
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
            setCursor(-1); // Reset cursor on new results
        } catch (err) {
            console.error("Error fetching med suggestions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearchTerm(text);
        onChange(text);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 300);
    };

    const handleSelect = (med) => {
        setSearchTerm(med.full_label);
        onChange(med.full_label);
        setShowSuggestions(false);
        setCursor(-1);
        if (onSelectMedication) onSelectMedication(med);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            // Always prevent form submission when Enter is pressed in autocomplete
            e.preventDefault();

            if (showSuggestions && cursor >= 0 && cursor < suggestions.length) {
                // Select the highlighted suggestion
                handleSelect(suggestions[cursor]);
            } else if (showSuggestions && suggestions.length > 0) {
                // If no cursor but we have suggestions, select the first one
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

    // Helper to highlight match
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const parts = query.split(/\s+/).filter(q => q.length > 0);
        const regex = new RegExp(`(${parts.join('|')})`, 'gi');
        const chunks = text.split(regex);
        return (
            <span>
                {chunks.map((chunk, i) =>
                    regex.test(chunk) ? <strong key={i} className="text-blue-600 bg-blue-50">{chunk}</strong> : chunk
                )}
            </span>
        );
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative flex items-center group">
                <input
                    type="text"
                    className={className || "input-field w-full pr-10"}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('search_medication') || "Buscar medicamento..."}
                    autoComplete="off"
                />
                <div className="absolute right-3 flex items-center gap-2">
                    {loading ? (
                        <div className="spinner-small"></div>
                    ) : searchTerm ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-slate-300 hover:text-slate-500 transition-colors text-lg"
                            tabIndex="-1"
                        >
                            ✕
                        </button>
                    ) : (
                        <span className="text-slate-300 text-lg">🔍</span>
                    )}
                </div>
            </div>
            {showSuggestions && suggestions.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute top-full left-0 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-72 overflow-y-auto list-none p-0 animate-fade-in"
                >
                    {suggestions.map((med, idx) => (
                        <li
                            key={idx}
                            className={`px-4 py-3 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors ${cursor === idx ? 'bg-blue-50 border-l-4 border-l-blue-500 pl-3' : 'hover:bg-slate-50'
                                }`}
                            onClick={() => handleSelect(med)}
                            onMouseEnter={() => setCursor(idx)}
                        >
                            <div className="font-bold text-main-800 leading-tight">
                                {highlightMatch(med.name, searchTerm)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-2 items-center">
                                <span className="bg-slate-100 px-1 rounded">{med.presentation}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-medium">{highlightMatch(med.drug, searchTerm)}</span>
                                <span className="text-slate-400">•</span>
                                <span className="italic opacity-70">{highlightMatch(med.lab, searchTerm)}</span>
                            </div>
                        </li>
                    ))}
                    <li className="px-4 py-2 text-[10px] text-slate-400 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
                        <span className="font-bold uppercase tracking-widest">{t('iosfa_vademecum')}</span>
                        <span className="opacity-50 italic">{suggestions.length} {t('results') || 'resultados'}</span>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default MedicationAutocomplete;
