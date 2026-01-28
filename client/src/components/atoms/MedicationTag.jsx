import React from 'react';
import './MedicationTag.css';

/**
 * MedicationTag Atom
 * Displays a single medication as a removable tag
 * @param {string} label - The medication name/label to display
 * @param {function} onRemove - Callback when remove button is clicked
 * @param {string} className - Additional CSS classes
 */
const MedicationTag = ({ label, onRemove, className = '' }) => {
    return (
        <span className={`medication-tag ${className}`}>
            <span className="medication-tag__label">{label}</span>
            <button
                type="button"
                onClick={onRemove}
                className="medication-tag__remove-btn"
                aria-label="Remove medication"
            >
                ×
            </button>
        </span>
    );
};

export default MedicationTag;
