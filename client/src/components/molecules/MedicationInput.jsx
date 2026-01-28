import React, { useState } from 'react';
import MedicationAutocomplete from './MedicationAutocomplete';
import MedicationList from './MedicationList';
import './MedicationInput.css';

/**
 * MedicationInput Molecule
 * Allows adding multiple medications with autocomplete
 * @param {Array} medications - Current list of medications
 * @param {function} onAdd - Callback when a medication is added
 * @param {function} onRemove - Callback when a medication is removed (receives index)
 * @param {string} label - Label for the input
 * @param {string} placeholder - Placeholder text
 * @param {boolean} optional - Whether this field is optional
 * @param {string} className - Additional CSS classes
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
        <div className={`medication-input ${className}`}>
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
