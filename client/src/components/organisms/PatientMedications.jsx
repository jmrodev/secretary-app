import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import './PatientMedications.css';

// Hooks
import { useMedicalRecords } from '../../hooks/useMedicalRecords';

// Sub-components
import MedicationHistory from '../molecules/MedicationHistory';
import ActiveMedicationsList from '../molecules/ActiveMedicationsList';
import AddMedicationForm from './AddMedicationForm';

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

    return (
        <div className="patient-medications">
            {/* Block 3: Prescription History */}
            <MedicationHistory recentRequests={recentRequests} t={t} />

            {/* Block 4: Active/Chronic Medications */}
            <section className="details-block details-block--medications">
                <header className="details-block__header">
                    <h3 className="details-block__title">
                        <Icon name="medication" size="1.2rem" />
                        {t('patient_current_meds') || 'Medicación Habitual / Crónicos'}
                    </h3>
                    {!isAdding && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsAdding(true)}
                            icon={<Icon name="settings" size="1rem" />}
                        >
                            {t('configure') || 'Configurar'}
                        </Button>
                    )}
                </header>

                <div className="details-block__content">
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
