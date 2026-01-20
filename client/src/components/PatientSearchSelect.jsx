import React from 'react';
import AsyncSelect from 'react-select/async';
import api from '../api/axios';

import { components } from 'react-select';

import { useLanguage } from '../context/LanguageContext';

const PatientSearchSelect = ({ value, onChange, placeholder, onCreatePatient, autoFocus = false }) => {
    const { t } = useLanguage();
    const finalPlaceholder = placeholder || t('search_placeholder');

    const loadOptions = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            const res = await api.get(`/users/patients?search=${inputValue}`);
            return res.data.map(p => ({
                value: p.id,
                label: `${p.full_name} - DNI: ${p.dni || 'N/A'} - ${p.address || ''}`,
                patient: p // Pass full object if needed
            }));
        } catch (err) {
            console.error("Error searching patients", err);
            return [];
        }
    };

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : '', selectedOption ? selectedOption.patient : null);
    };

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            onChange={handleChange}
            autoFocus={autoFocus}
            placeholder={finalPlaceholder}
            noOptionsMessage={({ inputValue }) => (
                <div className="text-center p-2">
                    <p className="text-main-500 mb-2">
                        {t('no_results_for')} "{inputValue}"
                    </p>
                    {onCreatePatient && inputValue && (
                        <button
                            type="button" // Prevent form submit
                            className="btn btn-sm btn-outline-primary"
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur
                                e.stopPropagation();
                                onCreatePatient(inputValue);
                            }}
                        >
                            {t('create_new_patient')}
                        </button>
                    )}
                </div>
            )}
            loadingMessage={() => t('loading')}
            styles={{
                control: (base) => ({
                    ...base,
                    borderColor: '#e2e8f0',
                    borderRadius: '0.375rem',
                    padding: '2px',
                    boxShadow: 'none',
                    backgroundColor: 'white', // Ensure white background
                    '&:hover': {
                        borderColor: '#cbd5e1'
                    }
                }),
                input: (base) => ({
                    ...base,
                    color: '#0f172a', // gray-900 for maximum contrast
                    backgroundColor: 'transparent'
                }),
                singleValue: (base) => ({
                    ...base,
                    color: '#0f172a',
                    fontWeight: '650' // slightly bolder
                }),
                placeholder: (base) => ({
                    ...base,
                    color: '#64748b' // gray-500
                }),
                menu: (base) => ({
                    ...base,
                    zIndex: 9999
                })
            }}
            // Disable browser autocomplete to prevent password manager interference
            autoComplete="chrome-off"
            inputId="patient-search-input"
        />
    );
};


export default PatientSearchSelect;
