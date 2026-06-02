import React, { useMemo } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';

// Local Feature Components
import PrescriptionHabitualMeds from '@/features/medical_documents/components/sections/PrescriptionHabitualMeds';
import PrescriptionFormFields from '@/features/medical_documents/components/forms/PrescriptionFormFields';
import PrescriptionItemsList from '@/features/medical_documents/components/lists/PrescriptionItemsList';
import PrescriptionExtraFields from '@/features/medical_documents/components/sections/PrescriptionExtraFields';
import { usePrescriptionModalController, FREQ_PRESETS } from '../../hooks/usePrescriptionModalController';

import './PrescriptionModal.css';

/**
 * PrescriptionModal Organism (Feature-based).
 * Orchestrates habitual meds, form entry, and item listing for medical prescriptions.
 */
const PrescriptionModal = ({ isOpen, onClose, patientName, patientId, onSubmit, t, isSubmitting }) => {
    const { showMessage } = useMessage();
    const { state, handlers, computed } = usePrescriptionModalController(patientId, onSubmit, showMessage, t);

    const {
        instructions, items, patientMeds, historyMeds, bonified,
        tempMed, tempDose, tempUnitsPerBox, tempDailyUnits, tempBoxes,
        tempFreqPreset
    } = state;

    const {
        setInstructions, setBonified, setTempMed, setTempDose,
        setTempUnitsPerBox, setTempDailyUnits, setTempBoxes,
        handleSelectMedication, handleFreqPreset, handleAddItem,
        handleRemoveItem, handleSubmit
    } = handlers;

    const { daysSupply, refillDateStr } = computed;

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
