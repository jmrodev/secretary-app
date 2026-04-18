import React, { useState } from 'react';
import MedicationAutocomplete from '@/features/medical_documents/components/MedicationAutocomplete';
import MedicationList from '@/features/medical_documents/components/MedicationList';
import './MedicationInput.css';

/**
 * MedicationInput Feature Molecule.
 * Higher-level input that combines autocomplete search and a list of selected items.
 * Used across various medical forms within the medical_documents domain.
 */
const MedicationInput = ({
    medications = [],
    onAdd,
    onRemove,
    label = 'Medications',
    placeholder = 'Search and add medication...',
    optional = false,
    className = ''
}) => {
    const [searchValue, setSearchValue] = useState('');

    const handleSelectMedication = (med) => {
        onAdd(med);
        setSearchValue(''); // Clear search after adding
    };

    return (
        <div className={`medication-input ${className} animate-fadeIn`}>
            <div className="medication-input__header">
                <label className="medication-input__label">
                    {label}
                    {optional && (
                        <span className="medication-input__optional-badge">Optional</span>
                    )}
                </label>
            </div>

            <MedicationAutocomplete
                value={searchValue}
                onChange={setSearchValue}
                onSelectMedication={handleSelectMedication}
                placeholder={placeholder}
                className="medication-input__autocomplete"
            />

            <MedicationList
                medications={medications}
                onRemove={onRemove}
                className="medication-input__list"
            />
        </div>
    );
};

export default MedicationInput;
