
import React from 'react';

/**
 * PrescriptionHabitualMeds Molecule.
 * Displays a grid of habitual medications for quick selection.
 */
const PrescriptionHabitualMeds = ({ patientMeds, historyMeds = [], items, handleSelectMedication, t }) => {
    const hasHabitual = patientMeds && patientMeds.length > 0;
    const hasHistory = historyMeds && historyMeds.length > 0;

    if (!hasHabitual && !hasHistory) return null;

    const renderGrid = (meds, label) => {
        if (!meds || meds.length === 0) return null;
        return (
            <div className="prescription-modal__habitual">
                <label className="prescription-modal__sub-label">
                    {label}:
                </label>
                <div className="prescription-modal__habitual-grid">
                    {meds.map((m, idx) => {
                        const name = m.medication_name || m.name;
                        const isSelected = items.some(i => i.name === name);
                        return (
                            <button
                                key={`${name}-${idx}`}
                                type="button"
                                title={isSelected ? t('remove') : t('add')}
                                className={`prescription-modal__habitual-btn${isSelected ? ' prescription-modal__habitual-btn--active' : ''}`}
                                onClick={() => handleSelectMedication(m)}
                            >
                                <span className="prescription-modal__habitual-name">{name}</span>
                                <div className="prescription-modal__habitual-meta">
                                    {m.dose && <span className="prescription-modal__habitual-dose">{m.dose}</span>}
                                    {(m.boxes_count || m.quantity) && (
                                        <span className="prescription-modal__habitual-qty">
                                            {m.dose ? ' • ' : ''}x{m.boxes_count || m.quantity}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="prescription-modal__quick-lists">
            {renderGrid(patientMeds, t('habitual_meds') || 'Habituales')}
            {renderGrid(historyMeds, t('recent_history') || 'Historial Reciente')}
        </div>
    );
};

export default PrescriptionHabitualMeds;
