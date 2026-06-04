import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './MedicationTag.module.css';

/**
 * MedicationTag Atom
 * Displays a single medication as a removable tag
 * @param {string} label - The medication name/label to display
 * @param {function} onRemove - Callback when remove button is clicked
 * @param {string} className - Additional CSS classes
 */
const MedicationTag = ({ label, onRemove, className = '' }) => {
    return (
        <span className={`${styles.root} ${className}`}>
            <span className={`${styles.label}`}>{label}</span>
            <Button
                variant="ghost"
                size="sm-compact"
                onClick={onRemove}
                className={`${styles.removeBtn}`}
                icon={<Icon name="close" size="1.1rem" />}
            />
        </span>
    );
};

export default MedicationTag;
