
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/features/auth'; // Assuming auth is a sibling feature
import api from '@/api/axios';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import './PatientMedications.css';

// Local Feature Hooks
import { useMedicalRecords } from '../hooks/useMedicalRecords';

// Local Feature Components
import MedicationHistory from './MedicationHistory';
import ActiveMedicationsList from './ActiveMedicationsList';
import AddMedicationForm from './AddMedicationForm';

/**
 * PatientMedications Organism (Executor/Sub-Orchestrator).
 * Manages the UI for prescriptions history and chronic medications.
 */
const PatientMedications = ({ patientId, patientName }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { user } = useAuth();

    const {
        medications,
        recentRequests,
        loading,
        isAdding,
        setIsAdding,
        pendingMedications,
        handleSaveMedications,
        handleDiscontinue,
        handleAddToPending,
        handleRemovePending,
        calculateRefillDate
    } = useMedicalRecords(patientId, showMessage, t);

    const handleRepeatPrescription = async (req) => {
        if (!window.confirm(t('confirm_repeat_prescription') || '¿Desea volver a solicitar esta receta al doctor?')) return;

        try {
            const payload = {
                type: 'prescription',
                patient_id: patientId,
                doctor_id: req.doctor_id || user?.user_id || user?.id,
                request_note: `[Solicitud Automática / Repetida]\n${req.request_note || ''}`,
                raw_medication_data: req.raw_medication_data || null,
                status: 'pending'
            };

            await api.post('/medical/requests', payload);
            showMessage(t('prescription_repeated_success') || 'Receta reenviada a los requerimientos del doctor correctamente.', 'success');
        } catch (err) {
            console.error("Error repeating prescription request", err);
            showMessage(t('prescription_repeated_error') || 'Hubo un error al intentar repetir la receta.', 'error');
        }
    };

    return (
        <div className="patient-medications">
            {/* Block 3: Prescription History */}
            <MedicationHistory
                recentRequests={recentRequests}
                t={t}
                onRepeat={handleRepeatPrescription}
            />

            {/* Block 4: Active/Chronic Medications */}
            <section className="patient-medications__section">
                <header className="patient-medications__header">
                    <h3 className="patient-medications__title">
                        <Icon name="medication" size="1.2rem" />
                        {t('patient_current_meds')}
                    </h3>
                    {!isAdding && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsAdding(true)}
                            icon={<Icon name="settings" size="1rem" />}
                        >
                            {t('configure')}
                        </Button>
                    )}
                </header>

                <div className="patient-medications__content">
                    {/* Adding Form */}
                    {isAdding && (
                        <AddMedicationForm
                            t={t}
                            onAdd={handleAddToPending}
                            onCancel={() => setIsAdding(false)}
                            onSave={handleSaveMedications}
                            onRemovePending={handleRemovePending}
                            pendingMedications={pendingMedications}
                            calculateRefillDate={calculateRefillDate}
                        />
                    )}

                    <ActiveMedicationsList
                        medications={medications}
                        loading={loading}
                        t={t}
                        onDiscontinue={handleDiscontinue}
                        settings={settings}
                        user={user}
                        patientName={patientName}
                        onRemindRefill={(med) => {
                            const template = settings.medication_refill_reminder_template ||
                                'Hola {patient_name}, te recordamos que según nuestros registros tu medicación ({medication_name}) está próxima a terminarse. ¿Necesitas que te preparemos la receta?';

                            const msg = template
                                .replace('{patient_name}', patientName || 'paciente')
                                .replace('{medication_name}', med.medication_name)
                                .replace('{secretary_name}', user?.full_name || '');

                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                    />
                </div>
            </section>
        </div>
    );
};

export default PatientMedications;
