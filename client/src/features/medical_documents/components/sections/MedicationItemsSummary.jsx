import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './MedicationItemsSummary.module.css';

/**
 * MedicationItemsSummary Feature Molecule.
 * Compact list view for medications already added to a prescription or request.
 * Part of the item review and deletion workflow in medical_documents.
 */
const MedicationItemsSummary = ({ items, onRemove, baseClass }) => {
    if (!items || items.length === 0) return null;

    return (
        <ul className={`${baseClass ? `${baseClass}__med-list` : styles.root} animate-fade-in`}>
            {items.map((item, idx) => (
                <li key={item.id || `${item.name}-${idx}`} className={`${baseClass ? `${baseClass}__med-item` : ''} medication-items-summary__item`}>
                    <div className={`${baseClass ? `${baseClass}__med-info` : ''} medication-items-summary__info`}>
                        <span className={`${baseClass ? `${baseClass}__med-name` : ''} medication-items-summary__name`}>{item.name}</span>
                        {item.dose && <span className={`${baseClass ? `${baseClass}__med-dose` : ''} medication-items-summary__dose`}>{item.dose}</span>}
                        {item.frequency && <span className={`${baseClass ? `${baseClass}__med-freq` : ''} medication-items-summary__freq`}>{item.frequency}</span>}
                        {item.quantity && <span className={`${baseClass ? `${baseClass}__med-qty` : ''} medication-items-summary__qty`}>x{item.quantity}</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onRemove(idx)}
                        icon={<Icon name="close" size="1.1rem" color="var(--error)" />}
                        className={`${styles.removeBtn}`}
                    />
                </li>
            ))}
        </ul>
    );
};

export default MedicationItemsSummary;
