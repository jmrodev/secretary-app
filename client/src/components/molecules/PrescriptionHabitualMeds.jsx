import React from 'react';

/**
 * PrescriptionHabitualMeds Molecule.
 * Displays a grid of habitual medications for quick selection.
 */
const PrescriptionHabitualMeds = ({ patientMeds, items, handleSelectMedication, t }) => {
    if (!patientMeds || patientMeds.length === 0) return null;

    return (
        <div className="prescription-modal__habitual">
            <label className="prescription-modal__sub-label">
                {t('habitual_meds') || 'Habituales'}:
            </label>
            <div className="prescription-modal__habitual-grid">
                {patientMeds.map(m => {
                    const isSelected = items.some(i => i.name === m.medication_name);
                    return (
                        <button
                            key={m.id}
                            type="button"
                            className={`prescription-modal__habitual-btn${isSelected ? ' prescription-modal__habitual-btn--active' : ''}`}
                            onClick={() => handleSelectMedication(m)}
                        >
                            <span className="prescription-modal__habitual-name">{m.medication_name}</span>
                            {m.dose && <span className="prescription-modal__habitual-dose">{m.dose}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PrescriptionHabitualMeds;
