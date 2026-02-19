import React, { useState, useMemo } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import Tooltip from '../atoms/Tooltip';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import { capitalizeFirst } from '../../utils/stringUtils';
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

    // ── Fetch patient habitual meds when modal opens ─────────────────────────
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
            // Reset all when modal closes
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

    // ── Select from autocomplete or habitual button ───────────────────────────
    const handleSelectMedication = (med) => {
        const medName = med.medication_name || med.name;
        setTempMed(medName);
        setTempDose(med.dose || '');
        setCurrentVademecumId(med.vademecum_id || med.id);

        // Auto-fill units per box if vademecum has it
        if (med.units_per_box) setTempUnitsPerBox(String(med.units_per_box));

        // Try to restore daily units from previous history
        if (med.daily_units) setTempDailyUnits(String(med.daily_units));
        if (med.boxes_count) setTempBoxes(String(med.boxes_count));
    };

    // ── Apply frequency preset ────────────────────────────────────────────────
    const handleFreqPreset = (idx) => {
        setTempFreqPreset(idx);
        const preset = FREQ_PRESETS[idx];
        if (preset.unitsPerDay !== null) {
            setTempDailyUnits(String(preset.unitsPerDay));
        } else {
            setTempDailyUnits('');
        }
    };

    // ── Add medication to list ────────────────────────────────────────────────
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
            quantity: tempBoxes.trim(), // boxes count
            days_supply: daysSupply
        };

        if (!items.some(i => i.name === medName)) {
            setItems(prev => [...prev, newItem]);

            // Build text label for preview textarea
            const supplyStr = daysSupply ? ` (~${daysSupply}d)` : '';
            const fullLabel = `${medName} ${tempDose.trim()} ${frequencyText} x${tempBoxes.trim()}${supplyStr}`.trim();
            const currentText = medications.trim();
            setMedications(currentText ? `${currentText}\n${fullLabel}` : fullLabel);

            resetFields();
        }
    };

    // ── Remove from list ──────────────────────────────────────────────────────
    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        const newText = newItems.map(i =>
            `${i.name} ${i.dose} ${i.frequency} x${i.quantity}${i.days_supply ? ` (~${i.days_supply}d)` : ''}`.trim()
        ).join('\n');
        setMedications(newText);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        let finalItems = [...items];
        let finalMeds = medications;

        // Auto-add pending temp med (if user forgot to press +)
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

        // Clear all
        setMedications('');
        setInstructions('');
        setItems([]);
        resetFields();
    };

    const canAdd = tempMed.trim().length > 0;
    const hasItems = items.length > 0;

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
                        disabled={(!hasItems && !tempMed.trim()) || isSubmitting}
                    >
                        {isSubmitting ? t('sending') : t('create')}
                    </Button>
                </>
            }
        >
            <div className="prescription-modal">

                {/* ── Habitual medications ──────────────────────────── */}
                {patientMeds.length > 0 && (
                    <div className="prescription-modal__habitual">
                        <label className="prescription-modal__sub-label">
                            {t('habitual_meds') || 'Habituales'}:
                        </label>
                        <div className="prescription-modal__habitual-grid">
                            {patientMeds.map(m => {
                                const isSelected = items.some(i => i.name === m.medication_name);
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`prescription-modal__habitual-btn${isSelected ? ' prescription-modal__habitual-btn--active' : ''}`}
                                        onClick={() => handleSelectMedication(m)}
                                    >
                                        <span className="prescription-modal__habitual-name">{m.medication_name}</span>
                                        {m.dose && <span className="prescription-modal__habitual-dose">{m.dose}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Medication search ─────────────────────────────── */}
                <div className="prescription-modal__group">
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">{t('medication') || 'Medicamento'}</label>
                        <MedicationAutocomplete
                            value={tempMed}
                            onChange={setTempMed}
                            placeholder={t('search_medication') || 'Buscar medicamento...'}
                            onSelectMedication={handleSelectMedication}
                        />
                    </div>

                    {/* ── Dose ─── */}
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('dose') || 'Dosis'}
                            <Tooltip text={t('dose_help') || 'Concentración / presentación (ej: 500mg, 10mg/ml)'} />
                        </label>
                        <Input
                            size="sm"
                            placeholder="500mg"
                            value={tempDose}
                            onChange={e => setTempDose(e.target.value)}
                        />
                    </div>

                    {/* ── Frequency presets ─── */}
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('frequency') || 'Frecuencia'}
                            <Tooltip text="Selecciona la frecuencia de toma. Esto determina cuántas pastillas/día consume el paciente." />
                        </label>
                        <div className="prescription-modal__freq-presets">
                            {FREQ_PRESETS.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`prescription-modal__freq-btn${tempFreqPreset === idx ? ' prescription-modal__freq-btn--active' : ''}`}
                                    onClick={() => handleFreqPreset(idx)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Numeric fields row ─── */}
                    <div className="prescription-modal__numeric-row">
                        <div className="prescription-modal__numeric-field">
                            <label className="prescription-modal__label">
                                {t('units_per_box') || 'Caja de (X) pastillas'}
                            </label>
                            <select
                                className="input input--sm"
                                style={{ width: '100%' }}
                                value={tempUnitsPerBox}
                                onChange={e => setTempUnitsPerBox(e.target.value)}
                            >
                                <option value="">{t('select_option') || 'Sel.'}</option>
                                {[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div className="prescription-modal__numeric-field">
                            <label className="prescription-modal__label">
                                {t('daily_units') || 'Pastillas por día'}
                            </label>
                            <select
                                className="input input--sm"
                                style={{ width: '100%' }}
                                value={tempDailyUnits}
                                onChange={e => {
                                    setTempDailyUnits(e.target.value);
                                    setTempFreqPreset(null); // manual → deselect preset
                                }}
                            >
                                <option value="">{t('select_option') || 'Sel.'}</option>
                                {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => (
                                    <option key={v} value={v}>
                                        {v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : v}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="prescription-modal__numeric-field">
                            <label className="prescription-modal__label">
                                {t('boxes') || 'Cantidad de cajas'}
                                <Tooltip text="Cantidad de cajas que se prescribe." />
                            </label>
                            <Input
                                size="sm"
                                type="number"
                                min="1"
                                placeholder="1"
                                value={tempBoxes}
                                onChange={e => setTempBoxes(e.target.value)}
                            />
                        </div>

                        {/* Add button */}
                        <div className="prescription-modal__add-col">
                            <label className="prescription-modal__label">&nbsp;</label>
                            <Button
                                type="button"
                                onClick={handleAddItem}
                                icon={<Icon name="ADD" />}
                                disabled={!canAdd}
                            >
                                {t('add') || 'Agregar'}
                            </Button>
                        </div>
                    </div>

                    {/* ── Days supply preview ─── */}
                    {daysSupply !== null && (
                        <div className="prescription-modal__supply-preview">
                            <Icon name="NOTIFICATIONS" size="1rem" />
                            <span>
                                {t('supply_prefix') || 'Abastece'} <strong>~{daysSupply} {t('days') || 'días'}</strong>
                                {refillDateStr && (
                                    <> · {t('automatic_reminder') || 'Recordatorio automático'}: <strong>{refillDateStr}</strong></>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Added items list ──────────────────────────────── */}
                {hasItems && (
                    <div className="prescription-modal__items-list">
                        <label className="prescription-modal__sub-label">
                            {t('medications_added') || 'Medicamentos agregados'}
                        </label>
                        {items.map((item, idx) => (
                            <div key={idx} className="prescription-modal__item">
                                <div className="prescription-modal__item-info">
                                    <span className="prescription-modal__item-name">{item.name}</span>
                                    <span className="prescription-modal__item-meta">
                                        {item.dose && <>{item.dose} · </>}
                                        {item.frequency && <>{item.frequency}</>}
                                        {item.quantity && <> · {item.quantity} {parseInt(item.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}</>}
                                        {item.days_supply && (
                                            <span className="prescription-modal__item-supply">
                                                {' '}~{item.days_supply} {t('days') || 'días'}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    onClick={() => handleRemoveItem(idx)}
                                    icon={<Icon name="CLOSE" size="1.2rem" />}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Instructions ──────────────────────────────────── */}
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
