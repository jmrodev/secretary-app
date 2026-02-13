import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import { capitalizeFirst } from '../../utils/stringUtils';
import './PrescriptionModal.css';

const PrescriptionModal = ({ isOpen, onClose, patientName, onSubmit, t, isSubmitting }) => {
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');
    const [items, setItems] = useState([]);

    const handleSelectMedication = (med) => {
        // Add to text view for visual comfort
        const current = medications.trim();
        const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
        setMedications(newValue);

        // Add to structured items
        setItems(prev => [...prev, {
            vademecum_id: med.id,
            name: med.name,
            presentation: med.presentation,
            drug: med.drug
        }]);
    };

    const handleSubmit = () => {
        if (!medications.trim() && items.length === 0) return;
        onSubmit({ medications, instructions, items });
        setMedications('');
        setInstructions('');
        setItems([]);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('prescription_for') || 'Receta para'} ${patientName}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={!medications.trim() || isSubmitting}>
                        {isSubmitting ? t('sending') : t('create')}
                    </Button>
                </>
            }
        >
            <div className="prescription-modal">
                <div className="prescription-modal__group">
                    <label className="prescription-modal__label">{t('medications')}</label>
                    <MedicationAutocomplete
                        value=""
                        onChange={() => { }}
                        placeholder={t('search_medication') || "Buscar medicamento..."}
                        onSelectMedication={handleSelectMedication}
                    />
                    <textarea
                        className="input-field prescription-modal__textarea"
                        rows="4"
                        value={medications}
                        onChange={e => setMedications(e.target.value)}
                        placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"}
                    />
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

