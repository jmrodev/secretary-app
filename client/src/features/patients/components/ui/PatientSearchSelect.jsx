import React from 'react';
import AsyncSelect from 'react-select/async';
import { patientService } from '@/features/patients/services/patientService';
import { Button } from '@/components/atoms/Button';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PatientSearchSelect.module.css';

const PatientSearchSelect = ({ value, onChange, placeholder, onCreatePatient, autoFocus: _autoFocus = false, selectedData }) => {
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
            console.error('[PatientSearchSelect] Error loading options:', err);
            return [];
        }
    };

    const handleSelectPatient = (selectedOption) => {
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
                control: ({ isFocused }) => `${styles.control} ${isFocused ? styles.controlFocused : ''}`,
                input: () => styles.input,
                menu: () => styles.menu,
                option: ({ isFocused, isSelected }) => `${styles.option} ${isFocused ? styles.optionFocused : ''} ${isSelected ? styles.optionSelected : ''}`,
                placeholder: () => styles.placeholder,
                singleValue: () => styles.singleValue,
                valueContainer: () => styles.valueContainer
            }}
            loadOptions={loadOptions}
            onChange={handleSelectPatient}
            placeholder={finalPlaceholder}
            isClearable={true}
            noOptionsMessage={({ inputValue }) => (
                <div className={`${styles.formSelectNoResults}`}>
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
