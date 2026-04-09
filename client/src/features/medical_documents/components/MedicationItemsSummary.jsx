import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * MedicationItemsSummary Feature Molecule.
 * Compact list view for medications already added to a prescription or request.
 * Part of the item review and deletion workflow in medical_documents.
 */
const MedicationItemsSummary = ({ items, onRemove, baseClass, t }) => {
    if (!items || items.length === 0) return null;

    return (
        <ul className={`${baseClass}__med-list animate-fadeIn`}>
            {items.map((item, idx) => (
                <li key={idx} className={`${baseClass}__med-item flex justify-between items-center p-2 mb-2 bg-white rounded-sm border border-gray-100 shadow-sm`}>
                    <div className={`${baseClass}__med-info flex flex-wrap gap-2 text-sm`}>
                        <span className={`${baseClass}__med-name font-bold`}>{item.name}</span>
                        {item.dose && <span className={`${baseClass}__med-dose text-gray-500`}>{item.dose}</span>}
                        {item.frequency && <span className={`${baseClass}__med-freq text-accent font-medium`}>{item.frequency}</span>}
                        {item.quantity && <span className={`${baseClass}__med-qty font-bold text-gray-700`}>x{item.quantity}</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onRemove(idx)}
                        icon={<Icon name="close" size="1.1rem" color="var(--error)" />}
                        className="hover:bg-red-50"
                    />
                </li>
            ))}
        </ul>
    );
};

export default MedicationItemsSummary;
