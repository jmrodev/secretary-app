import React, { useState, useMemo } from 'react';
import AsyncSelect from 'react-select/async';
import { patientService } from '@/features/patients/services/patientService';
import { Button } from '@/components/atoms/Button';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PatientSearchSelect.module.css';

export const PatientSearchSelect = ({ value, onChange, placeholder, onCreatePatient, autoFocus: _autoFocus = false, selectedData }) => {
    const { t } = useLanguage();
    const finalPlaceholder = placeholder || t('search_placeholder');
    const [internalSelected, setInternalSelected] = useState(null);

    const loadOptions = async (inputValue) => {
        try {
            const patients = await patientService.search(inputValue || '');
            
            return (patients || []).map(p => ({
                value: p.id,
                label: `${p.full_name} - DNI: ${p.dni || 'N/A'}${p.street_name ? ` - ${p.street_name}` : ''}`,
                patient: p
            }));
        } catch (err) {
            console.error('[PatientSearchSelect] Error loading options:', err);
            return [];
        }
    };

    const handleSelectPatient = (selectedOption) => {
        setInternalSelected(selectedOption);
        onChange(selectedOption ? selectedOption.value : '', selectedOption ? selectedOption.patient : null);
    };

    // Construct the selected option object
    const selectedOption = useMemo(() => {
        if (selectedData) {
            return {
                value: selectedData.id || value,
                label: selectedData.full_name ? `${selectedData.full_name}${selectedData.dni ? ` - DNI: ${selectedData.dni}` : ''}` : '',
                patient: selectedData
            };
        }
        if (internalSelected && String(internalSelected.value) === String(value)) {
            return internalSelected;
        }
        if (!value) return null;
        return internalSelected || { value, label: 'Paciente seleccionado' };
    }, [selectedData, internalSelected, value]);

    return (
        <AsyncSelect
            value={selectedOption}
            classNames={{
                control: ({ isFocused }) => `${styles.PatientSearchSelect__control} ${isFocused ? styles.PatientSearchSelect__controlFocused : ''}`,
                input: () => styles.PatientSearchSelect__input,
                menu: () => styles.PatientSearchSelect__menu,
                option: ({ isFocused, isSelected }) => `${styles.PatientSearchSelect__option} ${isFocused ? styles.PatientSearchSelect__optionFocused : ''} ${isSelected ? styles.PatientSearchSelect__optionSelected : ''}`,
                placeholder: () => styles.PatientSearchSelect__placeholder,
                singleValue: () => styles.PatientSearchSelect__singleValue,
                valueContainer: () => styles.PatientSearchSelect__valueContainer
            }}
            defaultOptions={true}
            loadOptions={loadOptions}
            onChange={handleSelectPatient}
            placeholder={finalPlaceholder}
            isClearable={true}
            noOptionsMessage={({ inputValue }) => (
                <div className={`${styles.PatientSearchSelect__formSelectNoResults}`}>
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
            autoComplete="chrome-off"
            inputId="patient-search-input"
            unstyled
            menuPortalTarget={document.body}
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, width: 'max-content', minWidth: '100%' })
            }}
        />
    );
};


