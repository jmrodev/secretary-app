import React from 'react';

/**
 * HabitualMedicationsGrid Molecule.
 * Displays a grid of habitual medications for quick selection.
 */
const HabitualMedicationsGrid = ({ patientMeds, medicationItems, onSelect, baseClass, t }) => {
    if (!patientMeds || patientMeds.length === 0) return null;

    return (
        <div className={`${baseClass}__habitual`}>
            <label className={`${baseClass}__field-label`}>
                {t('habitual_meds') || 'Habituales'}:
            </label>
            <div className={`${baseClass}__habitual-grid`}>
                {patientMeds.map(m => {
                    const isSelected = medicationItems.some(i => i.name === m.medication_name);
                    return (
                        <button
                            key={m.id}
                            type="button"
                            className={`${baseClass}__habitual-btn ${isSelected ? `${baseClass}__habitual-btn--active` : ''}`}
                            onClick={() => onSelect(m)}
                        >
                            <span className={`${baseClass}__habitual-name`}>{m.medication_name}</span>
                            {(m.dose || m.daily_intake || m.daily_units) && (
                                <span className={`${baseClass}__habitual-meta`}>
                                    {m.dose} {m.dose && (m.daily_intake || m.daily_units) ? '·' : ''} {m.daily_intake || m.daily_units ? `${m.daily_intake || m.daily_units}/d` : ''}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HabitualMedicationsGrid;
