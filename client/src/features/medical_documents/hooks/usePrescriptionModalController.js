import { useReducer, useMemo } from 'react';
import { formatDate } from '@/utils/core/dateUtils';
import { usePatientMedications } from '@/features/medical_documents/hooks/usePatientMedications';

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
export const FREQ_PRESETS = [
    { label: '1/día', unitsPerDay: 1, text: 'cada 24hs' },
    { label: '2/día', unitsPerDay: 2, text: 'cada 12hs' },
    { label: '3/día', unitsPerDay: 3, text: 'cada 8hs' },
    { label: '4/día', unitsPerDay: 4, text: 'cada 6hs' },
    { label: '½/día', unitsPerDay: 0.5, text: 'cada 48hs' },
    { label: '¼/día', unitsPerDay: 0.25, text: '1/4 cada 24hs' },
    { label: '¾/día', unitsPerDay: 0.75, text: '3/4 cada 24hs' },
    { label: 'Según necesidad', unitsPerDay: null, text: 'según necesidad' },
];

export const usePrescriptionModalController = (patientId, onSubmit, showMessage, t) => {
    const [state, dispatch] = useReducer((s, a) => {
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

    const setInstructions = (v) => dispatch({ field: 'instructions', value: v });
    const setItems = (v) => {
        const val = typeof v === 'function' ? v(state.items) : v;
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

    usePatientMedications(patientId, setPatientMeds, setHistoryMeds);

    const daysSupply = useMemo(() => ds(parseFloat(state.tempUnitsPerBox), parseFloat(state.tempBoxes), parseFloat(state.tempDailyUnits)), [state.tempUnitsPerBox, state.tempBoxes, state.tempDailyUnits]);

    const refillDateStr = useMemo(() => {
        if (!daysSupply) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysSupply);
        return formatDate(d, { monthName: true, hideYear: true });
    }, [daysSupply]);

    const handleSelectMedication = (med) => {
        const medName = med.full_label || med.medication_name || med.name;

        if (state.items.some(i => i.name === medName)) {
            handleRemoveItem(state.items.findIndex(i => i.name === medName));
            return;
        }

        const dose = med.dose || '';
        const upb = med.units_per_box || '';
        const daily = med.daily_units || med.daily_intake || '';
        const boxes = med.boxes_count || med.quantity || '';
        const vademecumId = med.vademecum_id || med.id;

        setTempMed(medName);
        setTempDose(dose);
        setCurrentVademecumId(vademecumId);
        setTempUnitsPerBox(String(upb));
        setTempDailyUnits(String(daily));
        setTempBoxes(String(boxes));

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
        if (!state.tempMed.trim()) return;

        const medName = state.tempMed.trim();
        const selectedPreset = state.tempFreqPreset !== null ? FREQ_PRESETS[state.tempFreqPreset] : null;
        const frequencyText = getFrequencyText(selectedPreset, state.tempDailyUnits);

        const newItem = {
            _id: generateId(),
            vademecum_id: state.currentVademecumId,
            name: medName,
            dose: state.tempDose.trim(),
            frequency: frequencyText,
            daily_units: parseFloat(state.tempDailyUnits) || null,
            units_per_box: parseFloat(state.tempUnitsPerBox) || null,
            quantity: state.tempBoxes.trim(),
            days_supply: daysSupply
        };

        setItems(prev => {
            let next;
            const existingIdx = prev.findIndex(i => i.name === medName);
            if (existingIdx > -1) {
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
        let finalItems = [...state.items];

        if (state.tempMed.trim()) {
            const selectedPreset = state.tempFreqPreset !== null ? FREQ_PRESETS[state.tempFreqPreset] : null;
            const frequencyText = getFrequencyText(selectedPreset, state.tempDailyUnits);

            const itemToInclude = {
                vademecum_id: state.currentVademecumId,
                name: state.tempMed.trim(),
                dose: state.tempDose.trim(),
                frequency: frequencyText,
                daily_units: parseFloat(state.tempDailyUnits) || null,
                units_per_box: parseFloat(state.tempUnitsPerBox) || null,
                quantity: state.tempBoxes.trim() || "1",
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

        onSubmit({ medications: finalMeds, instructions: state.instructions, items: finalItems, bonified: state.bonified });
        setInstructions('');
        setItems([]);
        resetFields();
    };

    return {
        state,
        handlers: {
            setInstructions,
            setBonified,
            setTempMed,
            setTempDose,
            setTempUnitsPerBox,
            setTempDailyUnits,
            setTempBoxes,
            handleSelectMedication,
            handleFreqPreset,
            handleAddItem,
            handleRemoveItem,
            handleSubmit
        },
        computed: {
            daysSupply,
            refillDateStr
        }
    };
};
