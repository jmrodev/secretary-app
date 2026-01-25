import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';

const PrescriptionModal = ({ isOpen, onClose, patientName, onSubmit, t, isSubmitting }) => {
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');

    const handleSubmit = () => {
        onSubmit({ medications, instructions });
        setMedications('');
        setInstructions('');
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
            <div className="flex flex-col gap-4">
                <div className="input-group">
                    <label className="input-label font-bold text-main-700">{t('medications')}</label>
                    <MedicationAutocomplete
                        value=""
                        onChange={() => { }}
                        placeholder={t('search_medication') || "Buscar medicamento..."}
                        onSelectMedication={(med) => {
                            const current = medications.trim();
                            const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                            setMedications(newValue);
                        }}
                    />
                    <textarea
                        className="input-field mt-2"
                        rows="4"
                        value={medications}
                        onChange={e => setMedications(e.target.value)}
                        placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label font-bold text-main-700">{t('instructions')}</label>
                    <textarea className="input-field" rows="3" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."} />
                </div>
            </div>
        </Modal>
    );
};

export default PrescriptionModal;
