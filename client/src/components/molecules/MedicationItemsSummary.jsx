import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * MedicationItemsSummary Molecule.
 * Displays a summary list of medications added to a request or prescription.
 */
const MedicationItemsSummary = ({ items, onRemove, baseClass, t }) => {
    if (!items || items.length === 0) return null;

    return (
        <ul className={`${baseClass}__med-list animate-fadeIn`}>
            {items.map((item, idx) => (
                <li key={idx} className={`${baseClass}__med-item`}>
                    <div className={`${baseClass}__med-info`}>
                        <span className={`${baseClass}__med-name`}>{item.name}</span>
                        {item.dose && <span className={`${baseClass}__med-dose`}>{item.dose}</span>}
                        {item.frequency && <span className={`${baseClass}__med-freq`}>{item.frequency}</span>}
                        {item.quantity && <span className={`${baseClass}__med-qty`}>x{item.quantity}</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onRemove(idx)}
                        icon={<Icon name="close" size="1rem" className="text-danger" />}
                    />
                </li>
            ))}
        </ul>
    );
};

export default MedicationItemsSummary;
