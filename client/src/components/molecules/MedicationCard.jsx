import React from 'react';
import Button from '../atoms/Button';
import './MedicationCard.css';

/**
 * MedicationCard molecule for displaying medication info with status.
 * Reused in RequirementsList.
 */
const MedicationCard = ({
    name,
    dose,
    frequency,
    quantity,
    duration,
    isKnown,
    onSave,
    canEdit,
    t
}) => {
    const baseClass = 'medication-card';
    const variantClass = isKnown ? `${baseClass}--known` : `${baseClass}--unknown`;

    return (
        <div className={`${baseClass} ${variantClass}`}>
            <div className={`${baseClass}__header`}>
                <span className={`${baseClass}__name`}>{name}</span>
                {isKnown ? (
                    <span className={`${baseClass}__status-icon`} title="En lista crónica">✓</span>
                ) : (
                    canEdit && onSave && (
                        <Button
                            size="sm-compact"
                            variant="secondary"
                            onClick={() => onSave(name)}
                            title="Agregar a ficha del paciente"
                        >
                            📥 Guardar
                        </Button>
                    )
                )}
            </div>
            <div className={`${baseClass}__details`}>
                {dose && <span className={`${baseClass}__badge`}>D: {dose}</span>}
                {frequency && <span className={`${baseClass}__badge`}>F: {frequency}</span>}
                {quantity && (
                    <span className={`${baseClass}__badge ${isKnown ? 'badge--success' : 'badge--warning'}`}>
                        Cant: {quantity}
                    </span>
                )}
                {duration && (
                    <span className={`${baseClass}__duration`}>
                        ⏱️ ~{duration} días
                    </span>
                )}
            </div>
        </div>
    );
};

export default MedicationCard;
