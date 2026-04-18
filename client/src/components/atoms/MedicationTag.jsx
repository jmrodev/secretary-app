import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
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
            <Button
                variant="ghost"
                size="sm-compact"
                onClick={onRemove}
                className="medication-tag__remove-btn"
                icon={<Icon name="close" size="1.1rem" />}
            />
        </span>
    );
};

export default MedicationTag;
