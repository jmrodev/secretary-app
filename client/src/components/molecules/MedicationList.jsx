import React from 'react';
import MedicationTag from '../atoms/MedicationTag';
import './MedicationList.css';

/**
 * MedicationList Molecule
 * Displays a list of medications with remove functionality
 * @param {Array} medications - Array of medication objects
 * @param {function} onRemove - Callback when a medication is removed (receives index)
 * @param {string} emptyMessage - Message to display when list is empty
 * @param {string} className - Additional CSS classes
 */
const MedicationList = ({
    medications = [],
    onRemove,
    emptyMessage = 'No medications added yet',
    className = ''
}) => {
    if (medications.length === 0) {
        return null; // Don't show anything if empty
    }

    return (
        <div className={`medication-list ${className}`}>
            <div className="medication-list__items">
                {medications.map((med, index) => (
                    <MedicationTag
                        key={index}
                        label={med.name || med.full_label || med.medication_name || med}
                        onRemove={() => onRemove(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MedicationList;
