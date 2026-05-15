import React from 'react';
import Button from '@/components/atoms/Button';

/**
 * QuickSelectGrid Sub-component.
 */
const QuickSelectGrid = ({ meds, label, items, onSelect, t }) => {
    if (!meds || meds.length === 0) return null;
    return (
        <div className="prescription-modal__habitual">
            <label className="prescription-modal__sub-label">
                {label}:
            </label>
            <div className="prescription-modal__habitual-grid">
                {meds.map((m) => {
                    const name = m.medication_name || m.name;
                    const isSelected = items.some(i => i.name === name);
                    return (
                        <Button
                            key={m.id || name}
                            type="button"
                            variant={isSelected ? 'accent' : 'ghost'}
                            title={isSelected ? t('remove') : t('add')}
                            className={`prescription-modal__habitual-btn${isSelected ? ' prescription-modal__habitual-btn--active' : ''}`}
                            onClick={() => onSelect(m)}
                            unstyled
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
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

const EMPTY_ARRAY = [];

/**
 * PrescriptionHabitualMeds Molecule.
 * Displays a grid of habitual medications for quick selection.
 */
const PrescriptionHabitualMeds = ({ patientMeds, historyMeds = EMPTY_ARRAY, items, handleSelectMedication, t }) => {
    const hasHabitual = patientMeds && patientMeds.length > 0;
    const hasHistory = historyMeds && historyMeds.length > 0;

    if (!hasHabitual && !hasHistory) return null;

    return (
        <div className="prescription-modal__quick-lists">
            <QuickSelectGrid
                meds={patientMeds}
                label={t('habitual_meds')}
                items={items}
                onSelect={handleSelectMedication}
                t={t}
            />
            <QuickSelectGrid
                meds={historyMeds}
                label={t('recent_history')}
                items={items}
                onSelect={handleSelectMedication}
                t={t}
            />
        </div>
    );
};

export default PrescriptionHabitualMeds;
