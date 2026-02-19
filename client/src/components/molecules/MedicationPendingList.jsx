import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * MedicationPendingList Molecule.
 * Displays the list of medications that have been added to the "to-save" list but not yet committed to the database.
 */
const MedicationPendingList = ({ pendingMedications, onRemovePending, t }) => {
    if (pendingMedications.length === 0) return null;

    return (
        <div className="patient-medications__pending-list">
            <label className="patient-medications__subtitle mb-2">
                {t('medications_to_add') || 'Lista a Guardar'} ({pendingMedications.length})
            </label>
            {pendingMedications.map((med, idx) => (
                <div key={idx} className="patient-medications__pending-item">
                    <div className="patient-medications__pending-info">
                        <div className="patient-medications__pending-name">{med.medication_name}</div>
                        <div className="patient-medications__pending-details">
                            {med.daily_intake && `${med.daily_intake} u/día`}
                            {med.frequency && ` • ${med.frequency}`}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onRemovePending(idx)}
                        className="patient-medications__remove-pending"
                        icon={<Icon name="close" size="1rem" />}
                    />
                </div>
            ))}
        </div>
    );
};

export default MedicationPendingList;
