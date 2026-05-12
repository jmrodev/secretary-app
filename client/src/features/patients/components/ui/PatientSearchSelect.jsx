import React from 'react';
import AsyncSelect from 'react-select/async';
import { patientService } from '@/features/patients/services/patientService';
import Button from '@/components/atoms/Button';
import { useLanguage } from '@/hooks/useLanguage';
import './PatientSearchSelect.css';

const PatientSearchSelect = ({ value, onChange, placeholder, onCreatePatient, autoFocus = false, selectedData }) => {
    const { t } = useLanguage();
    const finalPlaceholder = placeholder || t('search_placeholder');

    const loadOptions = async (inputValue) => {
        try {
            const patients = await patientService.search(inputValue);
            
            return patients.map(p => ({
                value: p.id,
                label: `${p.full_name} - DNI: ${p.dni || 'N/A'} - ${p.street_name || ''}`,
                patient: p
            }));
        } catch (err) {
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
                control: ({ isFocused }) => `patients-search-select__control ${isFocused ? 'patients-search-select__control--focused' : ''}`,
                input: () => 'patients-search-select__input',
                menu: () => 'patients-search-select__menu',
                option: ({ isFocused, isSelected }) => `patients-search-select__option ${isFocused ? 'patients-search-select__option--focused' : ''} ${isSelected ? 'patients-search-select__option--selected' : ''}`,
                placeholder: () => 'patients-search-select__placeholder',
                singleValue: () => 'patients-search-select__single-value',
                valueContainer: () => 'patients-search-select__value-container'
            }}
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            onChange={handleChange}
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
