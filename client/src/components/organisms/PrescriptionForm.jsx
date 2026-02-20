import React, { useState, useMemo } from 'react';

// Molecules
import HabitualMedicationsGrid from '../molecules/HabitualMedicationsGrid';
import MedicationInputSection from '../molecules/MedicationInputSection';
import MedicationItemsSummary from '../molecules/MedicationItemsSummary';

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
    baseClass
}) => {
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempFreq, setTempFreq] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');
    const [tempDailyUnits, setTempDailyUnits] = useState('');
    const [tempFreqPreset, setTempFreqPreset] = useState(null);
    const [currentVademecumId, setCurrentVademecumId] = useState(null);

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
    const handleSelectHabitual = (med) => {
        const medName = med.medication_name || med.name;
        setTempMed(medName);
        setTempDose(med.dose || '');
        setCurrentVademecumId(med.vademecum_id || med.id);

        if (med.units_per_box) setTempUnitsPerBox(String(med.units_per_box));

        const dailyVal = med.daily_units || med.daily_intake;
        if (dailyVal) {
            const sVal = String(dailyVal);
            setTempDailyUnits(sVal);
            const num = parseFloat(sVal);
            let fStr = `${sVal} por día`;
            if (num === 1) fStr = 'cada 24hs';
            else if (num === 2) fStr = 'cada 12hs';
            else if (num === 3) fStr = 'cada 8hs';
            else if (num === 4) fStr = 'cada 6hs';
            else if (num === 0.5) fStr = 'día por medio';
            setTempFreq(fStr);
        }

        if (med.boxes_count) setTempQty(String(med.boxes_count));
    };

    const handleAddItem = () => {
        if (!tempMed.trim()) return;
        const newItem = {
            name: tempMed.trim(),
            dose: tempDose.trim(),
            frequency: tempFreq.trim(),
            quantity: tempQty.trim(),
            units_per_box: parseFloat(tempUnitsPerBox) || null,
            daily_units: parseFloat(tempDailyUnits) || null,
            days_supply: daysSupply,
            vademecum_id: currentVademecumId
        };

        if (!medicationItems.some(i => i.name === newItem.name)) {
            setMedicationItems([...medicationItems, newItem]);
            // Reset temp fields
            setTempMed('');
            setTempDose('');
            setTempFreq('');
            setTempQty('');
            setTempUnitsPerBox('');
            setTempDailyUnits('');
            setTempFreqPreset(null);
            setCurrentVademecumId(null);
        }
    };

    const handleRemoveItem = (index) => {
        setMedicationItems(medicationItems.filter((_, i) => i !== index));
    };

    return (
        <div className={`${baseClass}__medication-section`}>
            <HabitualMedicationsGrid
                patientMeds={patientMeds}
                medicationItems={medicationItems}
                onSelect={handleSelectHabitual}
                baseClass={baseClass}
                t={t}
            />

            <MedicationInputSection
                tempMed={tempMed} setTempMed={setTempMed}
                tempDose={tempDose} setTempDose={setTempDose}
                tempFreqPreset={tempFreqPreset} setTempFreqPreset={setTempFreqPreset}
                tempFreq={tempFreq} setTempFreq={setTempFreq}
                tempDailyUnits={tempDailyUnits} setTempDailyUnits={setTempDailyUnits}
                tempUnitsPerBox={tempUnitsPerBox} setTempUnitsPerBox={setTempUnitsPerBox}
                tempQty={tempQty} setTempQty={setTempQty}
                daysSupply={daysSupply}
                refillDateStr={refillDateStr}
                onAddItem={handleAddItem}
                onVademecumSelect={(med) => {
                    const fullMedName = med.full_label || med.name;
                    setTempMed(fullMedName);
                    setCurrentVademecumId(med.id);
                }}
                freqPresets={FREQ_PRESETS}
                baseClass={baseClass}
                t={t}
            />

            <MedicationItemsSummary
                items={medicationItems}
                onRemove={handleRemoveItem}
                baseClass={baseClass}
                t={t}
            />
        </div>
    );
};

export default PrescriptionForm;
