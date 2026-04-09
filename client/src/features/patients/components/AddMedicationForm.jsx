
import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import MedicationAutocomplete from '@/features/medical_documents/components/MedicationAutocomplete';

// Local Feature Components
import MedicationPendingList from './MedicationPendingList';
import MedicationConfigFields from './MedicationConfigFields';

/**
 * AddMedicationForm Organism (Executor).
 * Orchestrates the search, configuration, and batching of habitual medications for a patient.
 */
const AddMedicationForm = ({
    t,
    onAdd,
    onCancel,
    onSave,
    onRemovePending,
    pendingMedications,
    calculateRefillDate
}) => {
    const [currentMed, setCurrentMed] = useState({
        medication_name: '',
        presentation: '',
        monodroga: '',
        dose: '',
        frequency: '',
        is_chronic: true,
        next_refill_date: '',
        notes: '',
        daily_intake: '',
        units_per_box: '',
        boxes_count: '1',
        vademecum_id: null,
        reminder_mode: 'calculation', // 'calculation', 'fixed_day', 'fixed_date'
        reminder_day: ''
    });

    const handleSelectFromVademecum = (med) => {
        let extractedUnits = '';
        const match = med.presentation.match(/x\s*(\d+)/i);
        if (match && match[1]) extractedUnits = match[1];

        const date = calculateRefillDate(extractedUnits, currentMed.daily_intake, currentMed.boxes_count);

        setCurrentMed(prev => ({
            ...prev,
            medication_name: med.full_label || `${med.name} ${med.presentation}`,
            presentation: med.presentation,
            monodroga: med.drug,
            units_per_box: extractedUnits,
            next_refill_date: date || prev.next_refill_date || '',
            vademecum_id: med.id
        }));
    };

    const handleDailyIntakeChange = (val) => {
        const date = calculateRefillDate(currentMed.units_per_box, val, currentMed.boxes_count);

        let freqStr = '';
        if (val) {
            const num = parseFloat(val);
            freqStr = `${val} por día`;
            if (num === 1) freqStr = 'cada 24hs';
            else if (num === 2) freqStr = 'cada 12hs';
            else if (num === 3) freqStr = 'cada 8hs';
            else if (num === 4) freqStr = 'cada 6hs';
            else if (num === 0.5) freqStr = 'día por medio';
        }

        setCurrentMed(prev => ({
            ...prev,
            daily_intake: val,
            frequency: freqStr || prev.frequency,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleUnitsChange = (val) => {
        const date = calculateRefillDate(val, currentMed.daily_intake, currentMed.boxes_count);
        setCurrentMed(prev => ({
            ...prev,
            units_per_box: val,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleBoxesChange = (val) => {
        const date = calculateRefillDate(currentMed.units_per_box, currentMed.daily_intake, val);
        setCurrentMed(prev => ({
            ...prev,
            boxes_count: val,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleModeChange = (mode) => {
        let nextDate = currentMed.next_refill_date;

        if (mode === 'calculation') {
            nextDate = calculateRefillDate(currentMed.units_per_box, currentMed.daily_intake, currentMed.boxes_count) || '';
        } else if (mode === 'fixed_day' && currentMed.reminder_day) {
            const date = new Date();
            date.setDate(currentMed.reminder_day);
            if (date <= new Date()) date.setMonth(date.getMonth() + 1);
            nextDate = date.toISOString().split('T')[0];
        }

        setCurrentMed(prev => ({
            ...prev,
            reminder_mode: mode,
            next_refill_date: nextDate
        }));
    };

    const handleReminderDayChange = (val) => {
        let nextDate = currentMed.next_refill_date;
        if (val) {
            const date = new Date();
            let day = parseInt(val);
            if (day < 1) day = 1;
            if (day > 31) day = 31;
            date.setDate(day);
            if (date <= new Date()) date.setMonth(date.getMonth() + 1);
            nextDate = date.toISOString().split('T')[0];
        }
        setCurrentMed(prev => ({ ...prev, reminder_day: val, next_refill_date: nextDate }));
    };

    const handleAddToPending = (e) => {
        if (e) e.preventDefault();
        if (!currentMed.medication_name) return;

        onAdd({ ...currentMed });
        setCurrentMed({
            medication_name: '',
            presentation: '',
            monodroga: '',
            dose: '',
            frequency: '',
            is_chronic: true,
            next_refill_date: '',
            notes: '',
            daily_intake: '',
            units_per_box: '',
            boxes_count: '1',
            vademecum_id: null,
            reminder_mode: 'calculation',
            reminder_day: ''
        });
    };

    return (
        <div className="patient-medications__form">
            <div className="patient-medications__form-card">
                <div className="config-field">
                    <label className="config-field__label">{t('search_medication') || 'Buscar Medicamento'}</label>
                    <MedicationAutocomplete
                        value={currentMed.medication_name}
                        onChange={(val) => setCurrentMed({ ...currentMed, medication_name: val })}
                        onSelectMedication={handleSelectFromVademecum}
                        placeholder={t('search_add_medication') || "Buscar y seleccionar..."}
                    />
                </div>

                <MedicationPendingList
                    pendingMedications={pendingMedications}
                    onRemovePending={onRemovePending}
                    t={t}
                />
            </div>

            {currentMed.medication_name && (
                <MedicationConfigFields
                    currentMed={currentMed}
                    handleModeChange={handleModeChange}
                    handleUnitsChange={handleUnitsChange}
                    handleBoxesChange={handleBoxesChange}
                    handleDailyIntakeChange={handleDailyIntakeChange}
                    handleReminderDayChange={handleReminderDayChange}
                    setCurrentMed={setCurrentMed}
                    handleAddToPending={handleAddToPending}
                    t={t}
                />
            )}

            <div className="patient-medications__form-actions">
                <Button variant="ghost" onClick={onCancel} icon={<Icon name="close" />}>
                    {t('cancel')}
                </Button>
                <Button
                    variant="success"
                    onClick={onSave}
                    disabled={pendingMedications.length === 0}
                    icon={<Icon name="save" />}
                >
                    {t('save_all')} {pendingMedications.length > 0 ? `(${pendingMedications.length})` : ''}
                </Button>
            </div>
        </div>
    );
};

export default AddMedicationForm;
