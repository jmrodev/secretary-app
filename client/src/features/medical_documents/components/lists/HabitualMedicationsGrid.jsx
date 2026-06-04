import React from 'react';
import Button from '@/components/atoms/Button';

/**
 * HabitualMedicationsGrid Feature Molecule.
 * Displays a grid of habitual medications for quick selection during prescription drafting.
 * Part of the item selection workflow in medical_documents.
 */
const HabitualMedicationsGrid = ({ patientMeds, medicationItems, onSelect, baseClass, t }) => {
    if (!patientMeds || patientMeds.length === 0) return null;

    return (
        <div className={`${baseClass}__habitual animate-fade-in`}>
            <label className={`${baseClass}__field-label block text-sm font-bold text-gray-700 mb-3`}>
                {t('habitual_meds') || 'Habituales'}:
            </label>
            <div className={`${baseClass}__habitual-grid grid grid-cols-2 md:grid-cols-3 gap-3`}>
                {patientMeds.map(m => {
                    const isSelected = medicationItems.some(i => i.name === m.medication_name);
                    return (
                        <Button
                            key={m.id}
                            type="button"
                            className={`${baseClass}__habitual-btn p-3 rounded-sm border transition-all text-left flex flex-col ${ isSelected ? 'bg-accent text-white border-accent shadow-md transform scale-[1.02]' : 'bg-white border-gray-100 hover:border-accent hover:bg-gray-50 text-gray-800' }`}
                            onClick={() => onSelect(m)}
                            unstyled
                        >
                            <span className={`${baseClass}__habitual-name font-bold text-sm block mb-1`}>{m.medication_name}</span>
                            {(m.dose || m.daily_intake || m.daily_units) && (
                                <span className={`${baseClass}__habitual-meta text-[10px] uppercase tracking-wider opacity-70`}>
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
