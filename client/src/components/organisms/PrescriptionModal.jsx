import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import Tooltip from '../atoms/Tooltip';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import { capitalizeFirst } from '../../utils/stringUtils';
import './PrescriptionModal.css';

const PrescriptionModal = ({ isOpen, onClose, patientName, patientId, onSubmit, t, isSubmitting }) => {
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');
    const [items, setItems] = useState([]);
    const [patientMeds, setPatientMeds] = useState([]);

    // States for structured input
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempFreq, setTempFreq] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [currentVademecumId, setCurrentVademecumId] = useState(null);
    const [currentUnitsPerBox, setCurrentUnitsPerBox] = useState(null); // NEW STATE

    React.useEffect(() => {
        if (isOpen && patientId) {
            import('../../api/axios').then(module => {
                const api = module.default;
                api.get(`/medical/patients/${patientId}/medications`)
                    .then(res => setPatientMeds(res.data))
                    .catch(err => console.error("Error fetching meds", err));
            });
        }
    }, [isOpen, patientId]);

    const handleSelectMedication = (med) => {
        const medName = med.medication_name || med.name;

        // Populate fields for refinement
        setTempMed(medName);
        setTempDose(med.dose || '');
        setTempFreq(med.frequency || '');
        setTempQty(med.quantity || ''); // This is likely the previous quantity from history
        setCurrentVademecumId(med.vademecum_id || med.id);
        setCurrentUnitsPerBox(med.units_per_box || null); // NEW: Capture units_per_box
    };

    const handleAddItem = () => {
        if (!tempMed.trim()) return;

        const medName = tempMed.trim();
        const newItem = {
            vademecum_id: currentVademecumId,
            name: medName,
            dose: tempDose.trim(),
            frequency: tempFreq.trim(),
            quantity: tempQty.trim(), // This is now boxes
            units_per_box: currentUnitsPerBox // NEW: Include units_per_box
        };

        if (!items.some(i => i.name === medName)) {
            setItems([...items, newItem]);

            // Build the text representation for the legacy/display medications state
            const fullLabel = `${medName} ${tempDose.trim()} ${tempFreq.trim()} ${tempQty.trim() ? 'x' + tempQty.trim() : ''}`.trim();
            const currentText = medications.trim();
            setMedications(currentText ? `${currentText}\n${fullLabel}` : fullLabel);

            // Reset temp fields
            setTempMed('');
            setTempDose('');
            setTempFreq('');
            setTempQty('');
            setCurrentVademecumId(null);
        }
    };

    const handleRemoveItem = (index) => {
        const itemToRemove = items[index];
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);

        // Update medications text area correspondingly (simplified regen)
        const newText = newItems.map(i =>
            `${i.name} ${i.dose} ${i.frequency} ${i.quantity ? 'x' + i.quantity : ''}`.trim()
        ).join('\n');
        setMedications(newText);
    };

    const handleSubmit = () => {
        // If there's something in temp med but not added yet, we could auto-add it or just require adding
        let finalItems = [...items];
        let finalMeds = medications;

        if (tempMed.trim() && !items.some(i => i.name === tempMed.trim())) {
            const lastItem = {
                vademecum_id: currentVademecumId,
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: tempFreq.trim(),
                quantity: tempQty.trim()
            };
            finalItems.push(lastItem);
            const label = `${lastItem.name} ${lastItem.dose} ${lastItem.frequency} ${lastItem.quantity ? 'x' + lastItem.quantity : ''}`.trim();
            finalMeds = medications.trim() ? `${medications.trim()}\n${label}` : label;
        }

        if (!finalMeds.trim() && finalItems.length === 0) return;

        onSubmit({
            instructions,
            items: finalItems // Only send structured items
        });

        // Clear states after submission
        setMedications(''); // Keep clearing for preview textarea
        setInstructions('');
        setItems([]);
        setTempMed('');
        setTempDose('');
        setTempFreq('');
        setTempQty('');
        setCurrentVademecumId(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('prescription_for') || 'Receta para'} ${patientName}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={items.length === 0 || isSubmitting}>
                        {isSubmitting ? t('sending') : t('create')}
                    </Button>
                </>
            }
        >
            <div className="prescription-modal">
                <div className="prescription-modal__group">
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('medication')}
                        </label>
                        <MedicationAutocomplete
                            value={tempMed}
                            onChange={setTempMed}
                            placeholder={t('search_medication') || "Buscar medicamento..."}
                            onSelectMedication={handleSelectMedication}
                        />
                    </div>

                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('dose')}
                            <Tooltip text={t('dose_help') || "Indica la concentración o presentación del medicamento, como '500mg' o '1 comprimido'"} />
                        </label>
                        <Input
                            size="sm"
                            placeholder={t('dose_placeholder') || "Dosis (ej: 500mg)"}
                            value={tempDose}
                            onChange={e => setTempDose(e.target.value)}
                        />
                    </div>
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('daily_consumption') || 'Consumo Diario'}
                            <Tooltip text={t('daily_consumption_help') || "Número de unidades de medicamento que el paciente consume por día."} />
                        </label>
                        <Input
                            size="sm"
                            placeholder={t('daily_consumption_placeholder') || "Unidades/día (ej: 1)"}
                            type="number"
                            value={tempFreq}
                            onChange={e => setTempFreq(e.target.value)}
                        />
                    </div>
                    <div className="prescription-modal__field-wrapper">
                        <label className="prescription-modal__label">
                            {t('quantity')}
                            <Tooltip text={t('qty_help') || "Número total de cajas del medicamento. Debe ser un número."} />
                        </label>
                        <div className="prescription-modal__qty-input-row">
                            <Input
                                size="sm"
                                placeholder={t('qty_placeholder') || "Cant."}
                                type="number"
                                value={tempQty}
                                onChange={e => setTempQty(e.target.value)}
                            />
                            <Button
                                type="button"
                                size="sm-compact"
                                onClick={handleAddItem}
                                icon={<Icon name="ADD" />}
                                disabled={!tempMed.trim()}
                            />
                        </div>
                    </div>

                    {patientMeds.length > 0 && (
                        <div className="prescription-modal__habitual">
                            <label className="prescription-modal__sub-label">{t('habitual_meds') || 'Historique / Habituales'}:</label>
                            <div className="prescription-modal__habitual-grid">
                                {patientMeds.map(m => {
                                    const isSelected = items.some(i => i.name === m.medication_name);
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            className={`prescription-modal__habitual-btn ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleSelectMedication(m)}
                                        >
                                            {m.medication_name} {m.dose}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className="prescription-modal__items-list">
                            {items.map((item, idx) => (
                                <div key={idx} className="prescription-modal__item">
                                    <div className="prescription-modal__item-info">
                                        <span className="prescription-modal__item-name">{item.name}</span>
                                        <span className="prescription-modal__item-meta">{item.dose} {item.frequency} {item.quantity ? 'x' + item.quantity : ''}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => handleRemoveItem(idx)}
                                        icon={<Icon name="CLOSE" size="1.2rem" className="text-danger" />}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="prescription-modal__field-wrapper mt-4">
                        <label className="prescription-modal__label">{t('preview_text') || 'Vista Previa Texto'}</label>
                        <textarea
                            className="input-field prescription-modal__textarea"
                            rows="2"
                            value={medications}
                            onChange={e => setMedications(e.target.value)}
                            placeholder={t('meds_placeholder') || "Medicamentos agregados..."}
                        />
                    </div>
                </div>
                <div className="prescription-modal__group">
                    <label className="prescription-modal__label">{t('instructions')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={instructions}
                        onChange={e => setInstructions(capitalizeFirst(e.target.value))}
                        placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default PrescriptionModal;

