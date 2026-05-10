
import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

import './MedicationPendingList.css';

/**
 * MedicationPendingList Molecule (Sub-Executor).
 * Displays the list of medications that have been added to the "to-save" list but not yet committed to the database.
 */
const MedicationPendingList = ({ pendingMedications, onRemovePending, t }) => {
    if (pendingMedications.length === 0) return null;

    return (
        <div className="medication-pending-list">
            <label className="medication-pending-list__title">
                {t('medications_to_add') || 'Lista a Guardar'} ({pendingMedications.length})
            </label>
            {pendingMedications.map((med, idx) => (
                <div key={idx} className="medication-pending-list__item">
                    <div className="medication-pending-list__info">
                        <div className="medication-pending-list__name">{med.medication_name}</div>
                        <div className="medication-pending-list__details">
                            {med.daily_intake && `${med.daily_intake} u/día`}
                            {med.frequency && ` • ${med.frequency}`}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onRemovePending(idx)}
                        className="medication-pending-list__remove"
                        icon={<Icon name="close" size="1rem" />}
                    />
                </div>
            ))}
        </div>
    );
};

export default MedicationPendingList;

