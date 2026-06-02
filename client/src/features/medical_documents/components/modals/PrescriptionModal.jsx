import React, { useMemo } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate } from '@/utils/core/dateUtils';
import { capitalizeFirst } from '@/utils/core/stringUtils';

// Local Feature Components
import PrescriptionHabitualMeds from '@/features/medical_documents/components/sections/PrescriptionHabitualMeds';
import PrescriptionFormFields from '@/features/medical_documents/components/forms/PrescriptionFormFields';
import PrescriptionItemsList from '@/features/medical_documents/components/lists/PrescriptionItemsList';
import PrescriptionExtraFields from '@/features/medical_documents/components/sections/PrescriptionExtraFields';
import { usePatientMedications } from '@/features/medical_documents/hooks/usePatientMedications';

import './PrescriptionModal.css';

const generateId = () => `${Date.now()}-${Math.random()}`;

const getFrequencyText = (selectedPreset, dailyUnits) => {
    if (selectedPreset) return selectedPreset.text;
    if (!dailyUnits) return '';
    const num = parseFloat(dailyUnits);
    if (num === 1) return 'cada 24hs';
    if (num === 2) return 'cada 12hs';
    if (num === 3) return 'cada 8hs';
    if (num === 4) return 'cada 6hs';
    if (num === 0.5) return 'día por medio';
    return `${dailyUnits} por día`;
};

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
 * PrescriptionModal Organism (Feature-based).
 * Orchestrates habitual meds, form entry, and item listing for medical prescriptions.
 */
const PrescriptionModal = ({ isOpen, onClose, patientName, patientId, onSubmit, t, isSubmitting }) => {
    const { showMessage } = useMessage();
    
    const [state, dispatch] = React.useReducer((s, a) => {
        if (a.type === 'RESET_FORM') return { ...s, ...a.payload };
        if (a.type === 'UPDATE') return { ...s, ...a.payload };
        return { ...s, [a.field]: a.value };
    }, {
        instructions: '',
        items: [],
        patientMeds: [],
        historyMeds: [],
        bonified: false,
        tempMed: '',
        tempDose: '',
        tempUnitsPerBox: '',
        tempDailyUnits: '',
        tempBoxes: '',
        tempFreqPreset: null,
        currentVademecumId: null
    });

    const {
        instructions, items, patientMeds, historyMeds, bonified,
        tempMed, tempDose, tempUnitsPerBox, tempDailyUnits, tempBoxes,
        tempFreqPreset, currentVademecumId
    } = state;

    const setInstructions = (v) => dispatch({ field: 'instructions', value: v });
    const setItems = (v) => {
        const val = typeof v === 'function' ? v(items) : v;
        dispatch({ field: 'items', value: val });
    };
    const setPatientMeds = (v) => dispatch({ field: 'patientMeds', value: v });
    const setHistoryMeds = (v) => dispatch({ field: 'historyMeds', value: v });
    const setBonified = (v) => dispatch({ field: 'bonified', value: v });
    const setTempMed = (v) => dispatch({ field: 'tempMed', value: v });
    const setTempDose = (v) => dispatch({ field: 'tempDose', value: v });
    const setTempUnitsPerBox = (v) => dispatch({ field: 'tempUnitsPerBox', value: v });
    const setTempDailyUnits = (v) => dispatch({ field: 'tempDailyUnits', value: v });
    const setTempBoxes = (v) => dispatch({ field: 'tempBoxes', value: v });
    const setTempFreqPreset = (v) => dispatch({ field: 'tempFreqPreset', value: v });
    const setCurrentVademecumId = (v) => dispatch({ field: 'currentVademecumId', value: v });

    // ── Fetch data ──────────────────────────────────────────────────────────
    // ── Helpers ─────────────────────────────────────────────────────────────
    const ds = (upb, boxes, daily) => {
        if (!upb || !boxes || !daily || daily <= 0) return null;
        return Math.floor((upb * boxes) / daily);
    };

    const resetFields = () => {
        dispatch({
            type: 'UPDATE',
            payload: {
                tempMed: '',
                tempDose: '',
                tempUnitsPerBox: '',
                tempDailyUnits: '',
                tempBoxes: '',
                tempFreqPreset: null,
                currentVademecumId: null,
                bonified: false
            }
        });
    };

    // ── Fetch data ──────────────────────────────────────────────────────────
    usePatientMedications(patientId, setPatientMeds, setHistoryMeds);

    // ── Live days-supply calculation ─────────────────────────────────────────
    const daysSupply = useMemo(() => ds(parseFloat(tempUnitsPerBox), parseFloat(tempBoxes), parseFloat(tempDailyUnits)), [tempUnitsPerBox, tempBoxes, tempDailyUnits]);

    const refillDateStr = useMemo(() => {
        if (!daysSupply) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysSupply);
        return formatDate(d, { monthName: true, hideYear: true });
    }, [daysSupply]);

    // Use a reference date for calculations if needed, but for now we'll suppress warning on the UI side.



    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSelectMedication = (med) => {
        // Prioritize: 1. full_label (from search), 2. medication_name (from DB), 3. name (fallback)
        const medName = med.full_label || med.medication_name || med.name;

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
            const frequencyText = getFrequencyText(null, daily);

            const calcDs = ds(parseFloat(upb), parseFloat(boxes), parseFloat(daily));

            const newItem = {
                _id: generateId(),
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

        const frequencyText = getFrequencyText(selectedPreset, tempDailyUnits);

        const newItem = {
            _id: generateId(),
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

            return next;
        });

        resetFields();
    };

    const handleRemoveItem = (index) => {
        setItems(prev => {
            const newItems = prev.filter((_, i) => i !== index);
            return newItems;
        });
    };

    const handleSubmit = () => {
        let finalItems = [...items];

        if (tempMed.trim()) {
            const selectedPreset = tempFreqPreset !== null ? FREQ_PRESETS[tempFreqPreset] : null;
            const frequencyText = getFrequencyText(selectedPreset, tempDailyUnits);

            const itemToInclude = {
                vademecum_id: currentVademecumId,
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: frequencyText,
                daily_units: parseFloat(tempDailyUnits) || null,
                units_per_box: parseFloat(tempUnitsPerBox) || null,
                quantity: tempBoxes.trim() || "1",
                days_supply: daysSupply
            };

            const existingIdx = finalItems.findIndex(i => i.name === itemToInclude.name);
            if (existingIdx > -1) {
                finalItems[existingIdx] = itemToInclude;
            } else {
                finalItems.push(itemToInclude);
            }
        }

        if (finalItems.length === 0) {
            showMessage(t('please_add_at_least_one_medication') || 'Debe agregar al menos un medicamento a la lista.', 'warning');
            return;
        }

        const finalMeds = finalItems.map(i => {
            const supplyStr = i.days_supply ? ` (~${i.days_supply}d)` : '';
            const qtyStr = i.quantity && i.quantity !== '0' ? ` x${i.quantity}` : '';
            return `${i.name} ${i.dose || ''} ${i.frequency || ''}${qtyStr}${supplyStr}`.trim().replace(/\s+/g, ' ');
        }).join('\n');

        onSubmit({ medications: finalMeds, instructions, items: finalItems, bonified });
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
                <div className="prescription-modal__footer-actions">
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (items.length === 0 && !tempMed.trim())}
                        icon={<Icon name="SAVE" />}
                    >
                        {isSubmitting ? t('sending') : t('create')}
                    </Button>
                </div>
            }
        >
            <section className="prescription-modal">
                <h2 className="visually-hidden">{t('prescription_details')}</h2>
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
                    tempBoxes={tempBoxes} setTempBoxes={tempBoxes}
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

                <PrescriptionExtraFields
                    instructions={instructions}
                    setInstructions={setInstructions}
                    bonified={bonified}
                    setBonified={setBonified}
                    t={t}
                />
            </section>
        </Modal>
    );
};

export default PrescriptionModal;
