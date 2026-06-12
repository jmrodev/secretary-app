
import React from 'react';
import { isDueSoon } from '@/utils/core/dateUtils';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { PatientSearchSelect } from '@/features/patients';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import Badge from '@/components/atoms/Badge';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './MedicalRequestForm.module.css';

// Hooks
import { useMedicalRequest } from '@/features/medical_documents/hooks/useMedicalRequest';

// Sub-components
import PrescriptionForm from '@/features/medical_documents/components/forms/PrescriptionForm';
import SimpleRequestForm from '@/features/medical_documents/components/forms/SimpleRequestForm';

/**
 * MedicalRequestForm Organism (Feature-based).
 * Form to create new medical requests (prescriptions, licenses, certificates).
 */
const MedicalRequestForm = ({ doctors, onRequestCreated, initialType, initialSendToDoctor, noCard = false }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const {
        selectedDoctor, setSelectedDoctor,
        selectedPatient, setSelectedPatient,
        patientData, setPatientData,
        patientMeds,
        reqType, setReqType,
        reqNote, setReqNote,
        medicationItems, setMedicationItems,
        sendToDoctor, setSendToDoctor,
        bonified, setBonified,
        isSubmitting,
        handleCreateRequest,
        tempMedsProps
    } = useMedicalRequest(initialType, initialSendToDoctor, user, showMessage, t, onRequestCreated);

    const isExpired = React.useMemo(() => {
        if (reqType !== 'prescription') return false;
        return isDueSoon(patientData?.next_suggested_prescription_date, 0);
    }, [patientData?.next_suggested_prescription_date, reqType]);

    const handleSubmit = (e) => {
        handleCreateRequest(e, medicationItems, reqNote);
    };

    if (user?.role !== 'secretary' && user?.role !== 'doctor') return null;

    const baseClass = styles.root;

    const formContent = (
        <form onSubmit={handleSubmit} className={styles.root}>
            <div className={`${styles.row} ${styles.row3}`}>
                <Select
                    value={reqType}
                    onChange={e => setReqType(e.target.value)}
                    options={[
                        { value: '', label: t('request_type') || 'Tipo de solicitud' },
                        { value: 'prescription', label: t('prescription') },
                        { value: 'license', label: t('medical_license') },
                        { value: 'certificate', label: t('certificate') || 'Certificado' }
                    ]}
                />

                {user?.role === 'doctor' ? (
                    <div className={styles.readonlyValue}>
                        Dr. {user.full_name || user.username}
                    </div>
                ) : (
                    <Select
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                        required
                        options={[
                            { value: '', label: t('select_doctor') },
                            ...doctors.map(d => ({ 
                                value: d.id, 
                                label: `${d.full_name}${d.specialty ? ` - ${d.specialty}` : ''}` 
                            }))
                        ]}
                    />
                )}

                <div>
                    <PatientSearchSelect
                        value={selectedPatient}
                        selectedData={patientData}
                        onChange={(val, patient) => {
                            setSelectedPatient(val);
                            setPatientData(patient);
                        }}
                        placeholder={t('select_patient')}
                    />

                    {isExpired && reqType === 'prescription' && (
                        <div className={styles.badgeWrapper}>
                            <Badge variant="warning">
                                <Icon name="warning" size="1rem" />
                                {t('patient_has_valid_until') || 'Cobertura sugerida hasta'}: {formatDate(patientData.next_suggested_prescription_date)}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.subFormWrapper}>
                {reqType === 'prescription' ? (
                    <PrescriptionForm
                        t={t}
                        patientMeds={patientMeds}
                        medicationItems={medicationItems}
                        setMedicationItems={setMedicationItems}
                        baseClass={baseClass}
                        {...tempMedsProps}
                    />
                ) : (
                    <SimpleRequestForm
                        reqType={reqType}
                        reqNote={reqNote}
                        setReqNote={setReqNote}
                        t={t}
                        baseClass={styles.root}
                    />
                )}
            </div>

            <div className={styles.panel}>
                <div className={styles.panelItem}>
                    <input
                        type="checkbox"
                        id="req-forward"
                        className={styles.checkbox}
                        checked={sendToDoctor}
                        onChange={e => setSendToDoctor(e.target.checked)}
                    />
                    <label htmlFor="req-forward" className={styles.panelLabel}>
                        {t('send_to_doctor') === 'send_to_doctor' ? 'Enviar a revisión médica' : t('send_to_doctor')}
                    </label>
                </div>

                <div className={styles.panelItem}>
                    <input
                        type="checkbox"
                        id="bonified-req"
                        className={styles.checkbox}
                        checked={bonified}
                        onChange={e => setBonified(e.target.checked)}
                    />
                    <label htmlFor="bonified-req" className={styles.panelLabel}>
                        {t('bonified_request') === 'bonified_request' ? 'Solicitud Bonificada' : t('bonified_request')}
                    </label>
                </div>
            </div>

            <footer className={styles.footer}>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    icon={<Icon name="send" />}
                >
                    {isSubmitting ? (t('sending') || 'Enviando...') : t('send_request')}
                </Button>
            </footer>
        </form>
    );

    if (noCard) return formContent;

    return (
        <Card title={t('new_request')} className={`${styles.medicalRequestCard}`}>
            {formContent}
        </Card>
    );
};

export default MedicalRequestForm;
