import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const MedicationAutocomplete = ({ value, onChange, placeholder, className }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Common Argentinian medications as fallback/initial list
    const commonMedications = [
        "Amoxicilina", "Ibuprofeno", "Paracetamol", "Enalapril", "Losartan",
        "Atorvastatina", "Metformina", "Levotiroxina", "Aspirina", "Clonazepam",
        "Alprazolam", "Diclofenac", "Omeprazolam", "Metoclopramida", "Cefalexina",
        "Azitromicina", "Lorazepam", "Bisoprolol", "Amlodipina", "Simvastatina",
        "Sildenafil", "Tadalafil", "Rosuvastatina", "Furosemida", "Espironolactona",
        "Carvedilol", "Metoprolol", "Warfarina", "Acenocumarol", "Heparina",
        "Ciprofloxacina", "Amoxicilina + Ácido Clavulánico", "Mupirocina", "Betametasona",
        "Dexametasona", "Prednisona", "Hidrocortisona", "Salbutamol", "Fluticasona",
        "Budesonide", "Montelukast", "Cetirizina", "Loratadina", "Desloratadina",
        "Pantoprazol", "Lansoprazol", "Domperidona", "Trimebutina", "Hioscina",
        "Vitamina D3", "B12", "Ácido Fólico", "Sulfato Ferroso"
    ];

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

    const handleSearch = (text) => {
        setSearchTerm(text);
        onChange(text); // Basic behavioral change

        if (text.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Search in local list
        const filtered = commonMedications.filter(m =>
            m.toLowerCase().includes(text.toLowerCase())
        ).slice(0, 10);

        setSuggestions(filtered);
        setShowSuggestions(true);
    };

    const handleSelect = (med) => {
        setSearchTerm(med);
        onChange(med);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                className={className || "input-field"}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                placeholder={placeholder || t('search_medication') || "Buscar medicamento..."}
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto list-none p-0">
                    {suggestions.map((med, idx) => (
                        <li
                            key={idx}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                            onClick={() => handleSelect(med)}
                        >
                            {med}
                        </li>
                    ))}
                    <li className="px-4 py-1 text-xs text-slate-400 bg-slate-50 italic">
                        {t('local_vademecum') || 'Vademécum Local'}
                    </li>
                </ul>
            )}
        </div>
    );
};

export default MedicationAutocomplete;
