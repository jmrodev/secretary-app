import React, { useState, useMemo } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import { capitalizeFirst } from '../../utils/stringUtils';

// Molecules
import PrescriptionHabitualMeds from '../molecules/PrescriptionHabitualMeds';
import PrescriptionFormFields from '../molecules/PrescriptionFormFields';
import PrescriptionItemsList from '../molecules/PrescriptionItemsList';

import './PrescriptionModal.css';

// Common frequency presets: label (display) + unitsPerDay (numeric)
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
 * PrescriptionModal Organism.
 * Orchestrates habitual meds, form entry, and item listing for medical prescriptions.
 */
const PrescriptionModal = ({ isOpen, onClose, patientName, patientId, onSubmit, t, isSubmitting }) => {
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');
    const [items, setItems] = useState([]);
    const [patientMeds, setPatientMeds] = useState([]);

    // Structured input states
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');  // units inside a box
    const [tempDailyUnits, setTempDailyUnits] = useState('');   // pills/day
    const [tempBoxes, setTempBoxes] = useState('');             // how many boxes
    const [tempFreqPreset, setTempFreqPreset] = useState(null); // selected preset index
    const [currentVademecumId, setCurrentVademecumId] = useState(null);

    // ── Fetch patient habitual meds ─────────────────────────────────────────
    React.useEffect(() => {
        if (isOpen && patientId) {
            import('../../api/axios').then(module => {
                const api = module.default;
                api.get(`/medical/patients/${patientId}/medications`)
                    .then(res => setPatientMeds(res.data))
                    .catch(err => console.error("Error fetching meds", err));
            });
        }
        if (!isOpen) {
            resetFields();
        }
    }, [isOpen, patientId]);

    // ── Live days-supply calculation ─────────────────────────────────────────
    const daysSupply = useMemo(() => {
        const upb = parseFloat(tempUnitsPerBox);
        const boxes = parseFloat(tempBoxes);
        const daily = parseFloat(tempDailyUnits);
        if (!upb || !boxes || !daily || daily <= 0) return null;
        return Math.floor((upb * boxes) / daily);
    }, [tempUnitsPerBox, tempBoxes, tempDailyUnits]);

    const refillDateStr = useMemo(() => {
        if (!daysSupply) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysSupply);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }, [daysSupply]);

    // ── Reset helpers ─────────────────────────────────────────────────────────
    const resetFields = () => {
        setTempMed('');
        setTempDose('');
        setTempUnitsPerBox('');
        setTempDailyUnits('');
        setTempBoxes('');
        setTempFreqPreset(null);
        setCurrentVademecumId(null);
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSelectMedication = (med) => {
        const medName = med.medication_name || med.name;
        setTempMed(medName);
        setTempDose(med.dose || '');
        setCurrentVademecumId(med.vademecum_id || med.id);
        if (med.units_per_box) setTempUnitsPerBox(String(med.units_per_box));
        if (med.daily_units) setTempDailyUnits(String(med.daily_units));
        if (med.boxes_count) setTempBoxes(String(med.boxes_count));
    };

    const handleFreqPreset = (idx) => {
        setTempFreqPreset(idx);
        const preset = FREQ_PRESETS[idx];
        if (preset.unitsPerDay !== null) {
            setTempDailyUnits(String(preset.unitsPerDay));
        } else {
            setTempDailyUnits('');
        }
    };

    const handleAddItem = () => {
        if (!tempMed.trim()) return;

        const medName = tempMed.trim();
        const selectedPreset = tempFreqPreset !== null ? FREQ_PRESETS[tempFreqPreset] : null;

        let frequencyText = '';
        if (selectedPreset) {
            frequencyText = selectedPreset.text;
        } else if (tempDailyUnits) {
            const num = parseFloat(tempDailyUnits);
            if (num === 1) frequencyText = 'cada 24hs';
            else if (num === 2) frequencyText = 'cada 12hs';
            else if (num === 3) frequencyText = 'cada 8hs';
            else if (num === 4) frequencyText = 'cada 6hs';
            else if (num === 0.5) frequencyText = 'día por medio';
            else frequencyText = `${tempDailyUnits} por día`;
        }

        const newItem = {
            vademecum_id: currentVademecumId,
            name: medName,
            dose: tempDose.trim(),
            frequency: frequencyText,
            daily_units: parseFloat(tempDailyUnits) || null,
            units_per_box: parseFloat(tempUnitsPerBox) || null,
            quantity: tempBoxes.trim(),
            days_supply: daysSupply
        };

        if (!items.some(i => i.name === medName)) {
            setItems(prev => [...prev, newItem]);
            const supplyStr = daysSupply ? ` (~${daysSupply}d)` : '';
            const fullLabel = `${medName} ${tempDose.trim()} ${frequencyText} x${tempBoxes.trim()}${supplyStr}`.trim();
            const currentText = medications.trim();
            setMedications(currentText ? `${currentText}\n${fullLabel}` : fullLabel);
            resetFields();
        }
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        const newText = newItems.map(i =>
            `${i.name} ${i.dose} ${i.frequency} x${i.quantity}${i.days_supply ? ` (~${i.days_supply}d)` : ''}`.trim()
        ).join('\n');
        setMedications(newText);
    };

    const handleSubmit = () => {
        let finalItems = [...items];
        let finalMeds = medications;

        if (tempMed.trim() && !items.some(i => i.name === tempMed.trim())) {
            const selectedPreset = tempFreqPreset !== null ? FREQ_PRESETS[tempFreqPreset] : null;
            const frequencyText = selectedPreset ? selectedPreset.text : (tempDailyUnits ? `${tempDailyUnits}/día` : '');
            const lastItem = {
                vademecum_id: currentVademecumId,
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: frequencyText,
                daily_units: parseFloat(tempDailyUnits) || null,
                units_per_box: parseFloat(tempUnitsPerBox) || null,
                quantity: tempBoxes.trim(),
                days_supply: daysSupply
            };
            finalItems.push(lastItem);
            const supplyStr = daysSupply ? ` (~${daysSupply}d)` : '';
            const label = `${lastItem.name} ${lastItem.dose} ${frequencyText} x${lastItem.quantity}${supplyStr}`.trim();
            finalMeds = medications.trim() ? `${medications.trim()}\n${label}` : label;
        }

        if (!finalMeds.trim() && finalItems.length === 0) return;

        onSubmit({ medications: finalMeds, instructions, items: finalItems });
        setMedications('');
        setInstructions('');
        setItems([]);
        resetFields();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('prescription_for') || 'Receta para'} ${patientName}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={(!items.length && !tempMed.trim()) || isSubmitting}
                    >
                        {isSubmitting ? t('sending') : t('create')}
                    </Button>
                </>
            }
        >
            <div className="prescription-modal">
                <PrescriptionHabitualMeds
                    patientMeds={patientMeds}
                    items={items}
                    handleSelectMedication={handleSelectMedication}
                    t={t}
                />

                <PrescriptionFormFields
                    tempMed={tempMed} setTempMed={setTempMed}
                    tempDose={tempDose} setTempDose={setTempDose}
                    tempFreqPreset={tempFreqPreset} handleFreqPreset={handleFreqPreset}
                    tempUnitsPerBox={tempUnitsPerBox} setTempUnitsPerBox={setTempUnitsPerBox}
                    tempDailyUnits={tempDailyUnits} setTempDailyUnits={setTempDailyUnits}
                    tempBoxes={tempBoxes} setTempBoxes={setTempBoxes}
                    handleAddItem={handleAddItem}
                    handleSelectMedication={handleSelectMedication}
                    canAdd={tempMed.trim().length > 0}
                    daysSupply={daysSupply}
                    refillDateStr={refillDateStr}
                    freqPresets={FREQ_PRESETS}
                    t={t}
                />

                <PrescriptionItemsList
                    items={items}
                    handleRemoveItem={handleRemoveItem}
                    t={t}
                />

                <div className="prescription-modal__group">
                    <label className="prescription-modal__label">{t('instructions') || 'Instrucciones'}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={instructions}
                        onChange={e => setInstructions(capitalizeFirst(e.target.value))}
                        placeholder={t('instructions_placeholder') || 'ej. Tomar con comida. No superar dosis máxima.'}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default PrescriptionModal;
