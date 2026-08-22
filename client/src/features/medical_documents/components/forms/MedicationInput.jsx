import React, { useState } from 'react';
import { MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import { MedicationList } from '@/features/medical_documents/components/lists/MedicationList';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './MedicationInput.module.css';

const EMPTY_ARRAY = [];

/**
 * MedicationInput Feature Molecule.
 * Higher-level input that combines autocomplete search and a list of selected items.
 * Used across various medical forms within the medical_documents domain.
 */
export const MedicationInput = ({
    medications = EMPTY_ARRAY,
    onAdd,
    onRemove,
    label = 'Medications',
    placeholder = 'Search and add medication...',
    optional = false,
    className = ''
}) => {
    const { t } = useLanguage();
    const [searchValue, setSearchValue] = useState('');

    const handleSelectMedication = (med) => {
        onAdd(med);
        setSearchValue(''); // Clear search after adding
    };

    return (
        <div className={`${styles.MedicationInput__root} ${className} animate-fade-in`}>
            <div className={`${styles.MedicationInput__header}`}>
                <label htmlFor="medication-search" className={`${styles.MedicationInput__label}`}>
                    {label}
                    {optional && (
                        <span className={`${styles.MedicationInput__optionalBadge}`}>{t('optional')}</span>
                    )}
                </label>
            </div>

            <MedicationAutocomplete
                id="medication-search"
                value={searchValue}
                onChange={setSearchValue}
                onSelectMedication={handleSelectMedication}
                placeholder={placeholder}
                className={`${styles.MedicationInput__autocomplete}`}
            />

            <MedicationList
                medications={medications}
                onRemove={onRemove}
                className={`${styles.MedicationInput__list}`}
            />
        </div>
    );
};

