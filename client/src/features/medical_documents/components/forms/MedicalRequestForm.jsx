import React from 'react';
import { isDueSoon } from '@/utils/core/dateUtils';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { formatDate } from '@/utils/core/dateUtils';
import { PatientSearchSelect as DefaultPatientSearchSelect } from '@/features/patients/components/ui/PatientSearchSelect';
import styles from './MedicalRequestForm.module.css';

// Hooks
import { useMedicalRequest } from '@/features/medical_documents/hooks/useMedicalRequest';

// Sub-components
import { PrescriptionForm } from '@/features/medical_documents/components/forms/PrescriptionForm';
import { SimpleRequestForm } from '@/features/medical_documents/components/forms/SimpleRequestForm';

/**
 * MedicalRequestForm Organism (Feature-based).
 * Form to create new medical requests. Doctor is derived from global context.
 */
export const MedicalRequestForm = ({ doctors, onRequestCreated, initialType, lockedType, initialSendToDoctor, noCard = false, PatientSearchSelectComponent }) => {
    const PatientSearchSelect = PatientSearchSelectComponent || DefaultPatientSearchSelect;
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const {
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

    const formContent = (
        <form onSubmit={handleSubmit} className={styles.MedicalRequestForm__root}>
            <div className={`${styles.MedicalRequestForm__row} ${styles.MedicalRequestForm__row2}`}>
                {!lockedType && (
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
                )}

                {/* ECC: Doctor selection removed from UI. It uses context automatically. */}

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
                        <div className={styles.MedicalRequestForm__badgeWrapper}>
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
                        baseClass={styles.MedicalRequestForm__root}
                        {...tempMedsProps}
                    />
                ) : (
                    <SimpleRequestForm
                        reqType={reqType}
                        reqNote={reqNote}
                        setReqNote={setReqNote}
                        t={t}
                        baseClass={styles.MedicalRequestForm__root}
                    />
                )}
            </div>

            <div className={styles.MedicalRequestForm__panel}>
                <div className={styles.MedicalRequestForm__panelItem}>
                    <input
                        type="checkbox"
                        id="req-forward"
                        className={styles.MedicalRequestForm__checkbox}
                        checked={sendToDoctor}
                        onChange={e => setSendToDoctor(e.target.checked)}
                    />
                    <label htmlFor="req-forward" className={styles.MedicalRequestForm__panelLabel}>
                        {t('send_to_doctor')}
                    </label>
                </div>

                <div className={styles.MedicalRequestForm__panelItem}>
                    <input
                        type="checkbox"
                        id="bonified-req"
                        className={styles.MedicalRequestForm__checkbox}
                        checked={bonified}
                        onChange={e => setBonified(e.target.checked)}
                    />
                    <label htmlFor="bonified-req" className={styles.MedicalRequestForm__panelLabel}>
                        {t('bonified_request')}
                    </label>
                </div>
            </div>

            <footer className={styles.MedicalRequestForm__footer}>
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
        <Card title={t('new_request')} className={`${styles.MedicalRequestForm__medicalRequestCard}`}>
            {formContent}
        </Card>
    );
};

