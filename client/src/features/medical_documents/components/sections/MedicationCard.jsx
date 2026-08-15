import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './MedicationCard.module.css';

/**
 * MedicationCard Feature Molecule.
 * Displays medication information with status indicators and quick-save actions.
 * Part of the treatment tracking and prescription management in medical_documents.
 */
export const MedicationCard = ({
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
    const baseClass = styles.MedicationCard__root;
    const variantClass = isKnown ? `${baseClass}--known` : `${baseClass}--unknown`;

    return (
        <div className={`${baseClass} ${variantClass} animate-fade-in`}>
            <div className={`${baseClass}__header`}>
                <span className={`${baseClass}__name`}>{name}</span>
                {isKnown ? (
                    <Icon name="check_circle" size="1.1rem" color="var(--success)" className={`${baseClass}__status-icon`} />
                ) : (
                    canEdit && onSave && (
                        <Button
                            size="sm-compact"
                            variant="secondary"
                            onClick={() => onSave(name)}
                            title={t('save_to_patient_file') || "Guardar en ficha"}
                            icon={<Icon name="save" size="0.9rem" />}
                        >
                            {t('save') || 'Guardar'}
                        </Button>
                    )
                )}
            </div>
            <div className={`${baseClass}__details`}>
                {dose && <span className={`${baseClass}__badge`}>D: {dose}</span>}
                {frequency && <span className={`${baseClass}__badge`}>F: {frequency}</span>}
                {quantity && (
                    <span className={`${baseClass}__badge ${isKnown ? 'badge--success' : 'badge--warning'}`}>
                        {t('qty_short') || 'Cant'}: {quantity}
                    </span>
                )}
                {duration && (
                    <span className={`${baseClass}__duration`}>
                        <Icon name="timer" size="0.9rem" />
                        ~{duration} {t('days') || 'días'}
                    </span>
                )}
            </div>
        </div>
    );
};

