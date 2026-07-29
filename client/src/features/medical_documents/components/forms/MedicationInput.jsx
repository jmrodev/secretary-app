import React, { useState } from 'react';
import MedicationAutocomplete from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import MedicationList from '@/features/medical_documents/components/lists/MedicationList';
import styles from './MedicationInput.module.css';

const EMPTY_ARRAY = [];

/**
 * MedicationInput Feature Molecule.
 * Higher-level input that combines autocomplete search and a list of selected items.
 * Used across various medical forms within the medical_documents domain.
 */
const MedicationInput = ({
    medications = EMPTY_ARRAY,
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
        <div className={`${styles.root} ${className} animate-fade-in`}>
            <div className={`${styles.header}`}>
                <label className={`${styles.label}`}>
                    {label}
                    {optional && (
                        <span className={`${styles.optionalBadge}`}>Optional</span>
                    )}
                </label>
            </div>

            <MedicationAutocomplete
                value={searchValue}
                onChange={setSearchValue}
                onSelectMedication={handleSelectMedication}
                placeholder={placeholder}
                className={`${styles.autocomplete}`}
            />

            <MedicationList
                medications={medications}
                onRemove={onRemove}
                className={`${styles.list}`}
            />
        </div>
    );
};

export default MedicationInput;
