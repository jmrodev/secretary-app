import { useReducer, useMemo } from 'react';
import { formatDate } from '@/utils/core/dateUtils';
import { usePatientMedications } from '@/features/medical_documents/hooks/usePatientMedications';

const ds = (upb, boxes, daily) => {
    const u = upb || 30;
    if (!boxes || !daily || daily <= 0) return null;
    return Math.floor((u * boxes) / daily);
};

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
    const setTempDays = (v) => dispatch({ field: 'tempDays', value: v });

    const resetFields = () => {
        dispatch({
            type: 'UPDATE',
            payload: {
                tempMed: '',
                tempDose: '',
                tempUnitsPerBox: '',
                tempDailyUnits: '',
                tempBoxes: '',
                tempDays: '',
                tempFreqPreset: null,
                currentVademecumId: null,
                bonified: false
            }
        });
    };

    usePatientMedications(patientId, setPatientMeds, setHistoryMeds);

    const daysSupply = useMemo(() => ds(parseFloat(state.tempUnitsPerBox), parseFloat(state.tempBoxes), parseFloat(state.tempDailyUnits)), [state.tempUnitsPerBox, state.tempBoxes, state.tempDailyUnits]);

    const handleQuantityChange = (field, value) => {
        const upb = parseFloat(state.tempUnitsPerBox) || 30; // Default a 30 si no hay
        const daily = parseFloat(state.tempDailyUnits) || 0;

        if (field === 'boxes') {
            setTempBoxes(value);
            if (value && daily) {
                const days = Math.floor((upb * parseFloat(value)) / daily);
                setTempDays(String(days));
            } else {
                setTempDays('');
            }
        } else if (field === 'days') {
            setTempDays(value);
            if (value && daily) {
                const boxes = Math.ceil((parseFloat(value) * daily) / upb);
                setTempBoxes(String(boxes));
            } else {
                setTempBoxes('');
            }
        } else if (field === 'units_per_box') {
            setTempUnitsPerBox(value);
            const newUpb = parseFloat(value) || 30;
            const boxes = parseFloat(state.tempBoxes);
            if (boxes && daily) {
                const days = Math.floor((newUpb * boxes) / daily);
                setTempDays(String(days));
            }
        }
    };

    const refillDateStr = useMemo(() => {
        const supply = state.tempDays ? parseFloat(state.tempDays) : daysSupply;
        if (!supply) return null;
        const d = new Date();
        d.setDate(d.getDate() + supply);
        return formatDate(d, { monthName: true, hideYear: true });
    }, [daysSupply, state.tempDays]);

    const handleSelectMedication = (med) => {
        const medName = med.full_label || med.medication_name || med.name;

        if (state.items.some(i => i.name === medName)) {
            handleRemoveItem(state.items.findIndex(i => i.name === medName));
            return;
        }

        const dose = med.dose || '';
        const upb = med.units_per_box || '';
        const daily = med.daily_units || med.daily_intake || '';
        const boxes = med.boxes_count || med.quantity || '1';
        const vademecumId = med.vademecum_id || med.id;

        setTempMed(medName);
        setTempDose(dose);
        setCurrentVademecumId(vademecumId);
        setTempUnitsPerBox(String(upb));
        setTempDailyUnits(String(daily));
        setTempBoxes(String(boxes));
        
        const calcUpb = parseFloat(upb) || 30;
        if (daily && boxes) {
            setTempDays(String(Math.floor((calcUpb * boxes) / daily)));
        } else {
            setTempDays('');
        }
        
        // Also figure out the preset index if it perfectly matches a preset
        const presetIdx = FREQ_PRESETS.findIndex(p => p.unitsPerDay === daily);
        if (presetIdx !== -1) {
            setTempFreqPreset(presetIdx);
        } else {
            setTempFreqPreset(null);
        }
    };

    const handleFreqPreset = (idx) => {
        setTempFreqPreset(idx);
        const preset = FREQ_PRESETS[idx];
        const daily = preset.unitsPerDay;
        
        if (daily !== null) {
            setTempDailyUnits(String(daily));
            const upb = parseFloat(state.tempUnitsPerBox) || 30;
            const boxes = parseFloat(state.tempBoxes);
            if (boxes) {
                setTempDays(String(Math.floor((upb * boxes) / daily)));
            }
        } else {
            setTempDailyUnits('');
            setTempDays('');
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
            handleSubmit,
            handleQuantityChange
        },
        computed: {
            daysSupply,
            refillDateStr
        }
    };
};
