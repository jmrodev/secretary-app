import React from 'react';
import { MedicationTag } from '@/components/atoms/MedicationTag';
import styles from './MedicationList.module.css';

/**
 * MedicationList Feature Molecule.
 * Renders a collection of MedicationTag atoms.
 * Typically used as the visual output of the MedicationInput component.
 */
const EMPTY_ARRAY = [];

export const MedicationList = ({
    medications = EMPTY_ARRAY,
    onRemove,
    className = ''
}) => {
    if (medications.length === 0) {
        return null; // Don't show anything if empty
    }

    return (
        <div className={`${styles.MedicationList__root} ${className} animate-fade-in`}>
            <div className={`${styles.MedicationList__items}`}>
                {medications.map((med, index) => (
                    <MedicationTag
                        key={med.id || med.medication_id || `med-${index}`}
                        label={med.name || med.full_label || med.medication_name || med}
                        onRemove={() => onRemove(index)}
                    />
                ))}
            </div>
        </div>
    );
};

