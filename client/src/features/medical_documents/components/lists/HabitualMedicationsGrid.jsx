import React from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './HabitualMedicationsGrid.module.css';

/**
 * HabitualMedicationsGrid Feature Molecule.
 * Displays a grid of habitual medications for quick selection during prescription drafting.
 * Part of the item selection workflow in medical_documents.
 */
export const HabitualMedicationsGrid = ({ patientMeds, medicationItems, onSelect, baseClass, t }) => {
    if (!patientMeds || patientMeds.length === 0) return null;

    return (
        <div className={`${baseClass}__habitual animate-fade-in`}>
            <div className={`${baseClass}__field-label ${styles.fieldLabel}`}>
                {t('habitual_meds')}:
            </div>
            <div className={`${baseClass}__habitual-grid ${styles.habitualGrid}`}>
                {patientMeds.map(m => {
                    const isSelected = medicationItems.some(i => i.name === m.medication_name);
                    return (
                        <Button
                            key={m.id}
                            type="button"
                            className={`${baseClass}__habitual-btn ${styles.habitualBtn} ${isSelected ? styles.habitualBtnSelected : styles.habitualBtnUnselected}`}
                            onClick={() => onSelect(m)}
                            unstyled
                        >
                            <span className={`${baseClass}__habitual-name ${styles.habitualName}`}>{m.medication_name}</span>
                            {(m.dose || m.daily_intake || m.daily_units) && (
                                <span className={`${baseClass}__habitual-meta ${styles.habitualMeta}`}>
                                    {m.dose} {m.dose && (m.daily_intake || m.daily_units) ? '·' : ''} {m.daily_intake || m.daily_units ? `${m.daily_intake || m.daily_units}/d` : ''}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

