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
    const [historyMeds, setHistoryMeds] = useState([]);

    // Structured input states
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');  // units inside a box
    const [tempDailyUnits, setTempDailyUnits] = useState('');   // pills/day
    const [tempBoxes, setTempBoxes] = useState('');             // how many boxes
    const [tempFreqPreset, setTempFreqPreset] = useState(null); // selected preset index
    const [currentVademecumId, setCurrentVademecumId] = useState(null);

    // ── Fetch data ──────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (isOpen && patientId) {
            import('../../api/axios').then(module => {
                const api = module.default;

                // Fetch habitual meds
                api.get(`/medical/patients/${patientId}/medications`)
                    .then(res => setPatientMeds(res.data))
                    .catch(err => console.error("Error fetching meds", err));

                // Fetch recent prescriptions to build history list
                api.get(`/medical/requests?patientId=${patientId}&type=prescription`)
                    .then(res => {
                        const historyItems = [];
                        const seenNames = new Set();

                        res.data.forEach(req => {
                            // 1. Try structured data first
                            if (req.raw_medication_data) {
                                try {
                                    const rawItems = typeof req.raw_medication_data === 'string'
                                        ? JSON.parse(req.raw_medication_data)
                                        : req.raw_medication_data;

                                    if (Array.isArray(rawItems)) {
                                        rawItems.forEach(it => {
                                            const name = it.medication_name || it.name;
                                            if (name && !seenNames.has(name.toLowerCase())) {
                                                historyItems.push(it);
                                                seenNames.add(name.toLowerCase());
                                            }
                                        });
                                    }
                                } catch (e) { console.warn("Error parsing raw_medication_data", e); }
                            }

                            // 2. Fallback to parsing text field if we need more
                            if (req.medications && seenNames.size < 10) {
                                req.medications.split('\n').forEach(line => {
                                    const name = line.trim().split(' (')[0].split(' x')[0].split(' cada')[0];
                                    if (name && !seenNames.has(name.toLowerCase())) {
                                        historyItems.push({ medication_name: name });
                                        seenNames.add(name.toLowerCase());
                                    }
                                });
                            }
                        });
                        setHistoryMeds(historyItems.slice(0, 15));
                    });
            });
        }
        if (!isOpen) {
            resetFields();
        }
    }, [isOpen, patientId]);

    // ── Live days-supply calculation ─────────────────────────────────────────
    const ds = (upb, boxes, daily) => {
        if (!upb || !boxes || !daily || daily <= 0) return null;
        return Math.floor((upb * boxes) / daily);
    };

    const daysSupply = useMemo(() => ds(parseFloat(tempUnitsPerBox), parseFloat(tempBoxes), parseFloat(tempDailyUnits)), [tempUnitsPerBox, tempBoxes, tempDailyUnits]);

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

        // Toggle Logic: if already in items, remove it.
        if (items.some(i => i.name === medName)) {
            handleRemoveItem(items.findIndex(i => i.name === medName));
            return;
        }

        const dose = med.dose || '';
        const upb = med.units_per_box || '';
        const daily = med.daily_units || med.daily_intake || '';
        const boxes = med.boxes_count || med.quantity || '';
        const vademecumId = med.vademecum_id || med.id;

        // Set form fields for potential editing
        setTempMed(medName);
        setTempDose(dose);
        setCurrentVademecumId(vademecumId);
        setTempUnitsPerBox(String(upb));
        setTempDailyUnits(String(daily));
        setTempBoxes(String(boxes));

        // Always add it to the list as long as we have a name
        if (medName) {
            let frequencyText = '';
            if (daily) {
                const num = parseFloat(daily);
                if (num === 1) frequencyText = 'cada 24hs';
                else if (num === 2) frequencyText = 'cada 12hs';
                else if (num === 3) frequencyText = 'cada 8hs';
                else if (num === 4) frequencyText = 'cada 6hs';
                else if (num === 0.5) frequencyText = 'día por medio';
                else frequencyText = `${daily} por día`;
            }

            const calcDs = ds(parseFloat(upb), parseFloat(boxes), parseFloat(daily));

            const newItem = {
                vademecum_id: vademecumId,
                name: medName,
                dose: dose.trim(),
                frequency: frequencyText,
                daily_units: parseFloat(daily) || null,
                units_per_box: parseFloat(upb) || null,
                quantity: String(boxes || '').trim(),
                days_supply: calcDs
            };

            setItems(prev => [...prev, newItem]);
            const supplyStr = calcDs ? ` (~${calcDs}d)` : '';
            const qtyStr = boxes ? ` x${boxes}` : '';
            const fullLabel = `${medName} ${dose.trim()} ${frequencyText}${qtyStr}${supplyStr}`.trim();
            setMedications(curr => curr.trim() ? `${curr.trim()}\n${fullLabel}` : fullLabel);
        }
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

        setItems(prev => {
            let next;
            const existingIdx = prev.findIndex(i => i.name === medName);
            if (existingIdx > -1) {
                // Update existing item
                next = [...prev];
                next[existingIdx] = newItem;
            } else {
                next = [...prev, newItem];
            }

            // Sync medications text area
            const newText = next.map(i => {
                const supplyStr = i.days_supply ? ` (~${i.days_supply}d)` : '';
                const qtyStr = i.quantity ? ` x${i.quantity}` : '';
                return `${i.name} ${i.dose} ${i.frequency}${qtyStr}${supplyStr}`.trim();
            }).join('\n');
            setMedications(newText);

            return next;
        });

        resetFields();
    };

    const handleRemoveItem = (index) => {
        setItems(prev => {
            const newItems = prev.filter((_, i) => i !== index);
            const newText = newItems.map(i => {
                const supplyStr = i.days_supply ? ` (~${i.days_supply}d)` : '';
                const qtyStr = i.quantity ? ` x${i.quantity}` : '';
                return `${i.name} ${i.dose} ${i.frequency}${qtyStr}${supplyStr}`.trim();
            }).join('\n');
            setMedications(newText);
            return newItems;
        });
    };

    const handleSubmit = () => {
        // ... (rest as before but using map to sync medications properly if needed)
        // Actually handleAddItem already syncs. If form has data not in items, handle it:
        let finalItems = [...items];

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
        }

        if (finalItems.length === 0) return;

        const finalMeds = finalItems.map(i => {
            const supplyStr = i.days_supply ? ` (~${i.days_supply}d)` : '';
            const qtyStr = i.quantity ? ` x${i.quantity}` : '';
            return `${i.name} ${i.dose} ${i.frequency}${qtyStr}${supplyStr}`.trim();
        }).join('\n');

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
                    historyMeds={historyMeds}
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
