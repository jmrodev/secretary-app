
import React, { useState, useMemo } from 'react';

// Molecules
import PrescriptionHabitualMeds from '@/features/medical_documents/components/PrescriptionHabitualMeds';
import PrescriptionFormFields from '@/features/medical_documents/components/PrescriptionFormFields';
import PrescriptionItemsList from '@/features/medical_documents/components/PrescriptionItemsList';

import './PrescriptionModal.css';

const FREQ_PRESETS = [
    { label: '1/día', unitsPerDay: 1, text: 'cada 24hs' },
    { label: '2/día', unitsPerDay: 2, text: 'cada 12hs' },
    { label: '3/día', unitsPerDay: 3, text: 'cada 8hs' },
    { label: '4/día', unitsPerDay: 4, text: 'cada 6hs' },
    { label: '½/día', unitsPerDay: 0.5, text: 'cada 48hs' },
    { label: '¼/día', unitsPerDay: 0.25, text: '1/4 cada 24hs' },
    { label: '¾/día', unitsPerDay: 0.75, text: '3/4 cada 24hs' },
    { label: 'Según necesidad', unitsPerDay: null, text: 'según necesidad' },
];

/**
 * PrescriptionForm Organism.
 * Orchestrates medication searching, selection from habitual history, and listing for batch processing.
 */
const PrescriptionForm = ({
    t,
    patientMeds,
    medicationItems,
    setMedicationItems,
    baseClass,
    // Prop-drilled state from useMedicalRequest
    tempMed, setTempMed,
    tempDose, setTempDose,
    tempFreq, setTempFreq,
    tempDailyUnits, setTempDailyUnits,
    tempUnitsPerBox, setTempUnitsPerBox,
    tempQty, setTempQty,
    tempVademecumId, setTempVademecumId
}) => {
    const [tempFreqPreset, setTempFreqPreset] = useState(null);

    // ── Live days-supply calculation ─────────────────────────────────────────
    const daysSupply = useMemo(() => {
        const upb = parseFloat(tempUnitsPerBox);
        const boxes = parseFloat(tempQty);
        const daily = parseFloat(tempDailyUnits);
        if (!upb || !boxes || !daily || daily <= 0) return null;
        return Math.floor((upb * boxes) / daily);
    }, [tempUnitsPerBox, tempQty, tempDailyUnits]);

    const refillDateStr = useMemo(() => {
        if (!daysSupply) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysSupply);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }, [daysSupply]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleFreqPreset = (idx) => {
        setTempFreqPreset(idx);
        const preset = FREQ_PRESETS[idx];
        if (preset.unitsPerDay !== null) {
            const val = String(preset.unitsPerDay);
            setTempDailyUnits(val);
            setTempFreq(preset.text);
        } else {
            setTempDailyUnits('');
            setTempFreq('según necesidad');
        }
    };

    const handleSelectMedication = (med) => {
        const medName = med.full_label || med.medication_name || med.name;

        // Toggle logic
        const existingIdx = medicationItems.findIndex(i => i.name === medName);
        if (existingIdx > -1) {
            handleRemoveItem(existingIdx);
            return;
        }

        const dose = med.dose || '';
        const upb = med.units_per_box || '';
        const daily = med.daily_units || med.daily_intake || '';
        const boxes = med.boxes_count || med.quantity || '';
        const vId = med.vademecum_id || med.id;

        setTempMed(medName);
        setTempDose(dose);
        setTempVademecumId(vId);
        setTempUnitsPerBox(String(upb));
        setTempDailyUnits(String(daily));
        setTempQty(String(boxes));

        if (daily) {
            const num = parseFloat(daily);
            let fStr = `${daily} por día`;
            if (num === 1) fStr = 'cada 24hs';
            else if (num === 2) fStr = 'cada 12hs';
            else if (num === 3) fStr = 'cada 8hs';
            else if (num === 4) fStr = 'cada 6hs';
            else if (num === 0.5) fStr = 'día por medio';
            setTempFreq(fStr);
        }
    };

    const handleAddItem = () => {
        if (!tempMed.trim()) return;
        const newItem = {
            name: tempMed.trim(),
            dose: tempDose.trim(),
            frequency: tempFreq.trim(),
            quantity: tempQty.trim() || '1',
            units_per_box: parseFloat(tempUnitsPerBox) || null,
            daily_units: parseFloat(tempDailyUnits) || null,
            days_supply: daysSupply,
            vademecum_id: tempVademecumId
        };

        const existingIdx = medicationItems.findIndex(i => i.name === newItem.name);
        if (existingIdx > -1) {
            const next = [...medicationItems];
            next[existingIdx] = newItem;
            setMedicationItems(next);
        } else {
            setMedicationItems([...medicationItems, newItem]);
        }

        // Reset
        setTempMed('');
        setTempDose('');
        setTempFreq('');
        setTempQty('');
        setTempUnitsPerBox('');
        setTempDailyUnits('');
        setTempFreqPreset(null);
        setTempVademecumId(null);
    };

    const handleRemoveItem = (index) => {
        setMedicationItems(medicationItems.filter((_, i) => i !== index));
    };

    return (
        <div className="prescription-modal">
            <PrescriptionHabitualMeds
                patientMeds={patientMeds}
                items={medicationItems}
                handleSelectMedication={handleSelectMedication}
                t={t}
            />

            <PrescriptionFormFields
                tempMed={tempMed} setTempMed={setTempMed}
                tempDose={tempDose} setTempDose={setTempDose}
                tempFreqPreset={tempFreqPreset} handleFreqPreset={handleFreqPreset}
                tempUnitsPerBox={tempUnitsPerBox} setTempUnitsPerBox={setTempUnitsPerBox}
                tempDailyUnits={tempDailyUnits} setTempDailyUnits={setTempDailyUnits}
                tempBoxes={tempQty} setTempBoxes={setTempQty}
                handleAddItem={handleAddItem}
                handleSelectMedication={handleSelectMedication}
                canAdd={tempMed.trim().length > 0}
                daysSupply={daysSupply}
                refillDateStr={refillDateStr}
                freqPresets={FREQ_PRESETS}
                t={t}
            />

            <PrescriptionItemsList
                items={medicationItems}
                handleRemoveItem={handleRemoveItem}
                t={t}
            />
        </div>
    );
};

export default PrescriptionForm;
