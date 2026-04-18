import React from 'react';
import AsyncSelect from 'react-select/async';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';

import { useLanguage } from '@/context/LanguageContext';

const PatientSearchSelect = ({ value, onChange, placeholder, onCreatePatient, autoFocus = false, selectedData }) => {
    const { t } = useLanguage();
    const finalPlaceholder = placeholder || t('search_placeholder');

    const loadOptions = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            const res = await api.get(`/users/patients?search=${inputValue}`);
            return res.data.map(p => ({
                value: p.id,
                label: `${p.full_name} - DNI: ${p.dni || 'N/A'} - ${p.street_name || ''}`,
                patient: p
            }));
        } catch (err) {
            console.error("Error searching patients", err);
            return [];
        }
    };

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : '', selectedOption ? selectedOption.patient : null);
    };

    // Construct the selected option object if we have selectedData
    const selectedOption = selectedData ? {
        value: selectedData.id || value,
        label: selectedData.full_name ? `${selectedData.full_name}${selectedData.dni ? ` - DNI: ${selectedData.dni}` : ''}` : '',
        patient: selectedData
    } : (value ? { value, label: 'Cargando...' } : null);

    return (
        <AsyncSelect
            value={selectedOption}
            classNames={{
                control: ({ isFocused }) => `input-field input-flex-container ${isFocused ? 'focus-ring' : ''}`,
                input: () => 'no-style-input',
                menu: () => 'dropdown-menu',
                option: ({ isFocused, isSelected }) => `dropdown-item ${isFocused ? 'active' : ''} ${isSelected ? 'selected' : ''}`,
                placeholder: () => 'placeholder-text',
                singleValue: () => 'single-value-text',
                valueContainer: () => 'value-flex-container'
            }}
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            onChange={handleChange}
            autoFocus={autoFocus}
            placeholder={finalPlaceholder}
            isClearable={true}
            noOptionsMessage={({ inputValue }) => (
                <div className="form-select-no-results">
                    <p>
                        {t('no_results_for')} "{inputValue}"
                    </p>
                    {onCreatePatient && inputValue && (
                        <Button
                            type="button" // Prevent form submit
                            className="btn btn-sm btn-outline-primary"
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur
                                e.stopPropagation();
                                onCreatePatient(inputValue);
                            }}
                            unstyled
                        >
                            {t('create_new_patient')}
                        </Button>
                    )}
                </div>
            )}
            loadingMessage={() => t('loading')}
            // Disable browser autocomplete to prevent password manager interference
            autoComplete="chrome-off"
            inputId="patient-search-input"
            unstyled // Removes default styles so our classes take over
            menuPortalTarget={document.body}
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
            }}
        />
    );
};


export default PatientSearchSelect;
