import React from 'react';
import Button from '@/components/atoms/Button';
<<<<<<< HEAD
import './HabitualMedicationsGrid.css';
=======
>>>>>>> main

/**
 * HabitualMedicationsGrid Feature Molecule.
 * Displays a grid of habitual medications for quick selection during prescription drafting.
 */
const HabitualMedicationsGrid = ({ patientMeds, medicationItems, onSelect, t }) => {
    if (!patientMeds || patientMeds.length === 0) return null;

    return (
        <div className="habitual-meds animate-fadeIn">
            <label className="habitual-meds__label">
                {t('habitual_meds') + ':'}
            </label>
            <div className="habitual-meds__grid">
                {patientMeds.map(m => {
                    const isSelected = medicationItems.some(i => i.name === m.medication_name);
                    return (
                        <Button
                            key={m.id}
                            type="button"
                            variant={isSelected ? 'primary' : 'ghost'}
                            className={`habitual-meds__btn ${isSelected ? 'habitual-meds__btn--active' : ''}`}
                            onClick={() => onSelect(m)}
                            unstyled
                        >
                            <span className="habitual-meds__name">{m.medication_name}</span>
                            {(m.dose || m.daily_intake || m.daily_units) && (
                                <span className="habitual-meds__meta">
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

export default HabitualMedicationsGrid;
