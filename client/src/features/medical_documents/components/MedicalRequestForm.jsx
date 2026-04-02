
import React from 'react';
import { useAuth } from '../../auth';
import { useLanguage } from '../../../context/LanguageContext';
import { useMessage } from '../../../context/MessageContext';
import { PatientSearchSelect } from '../../patients';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import FormGroup from '../../../components/molecules/FormGroup';
import Select from '../../../components/atoms/Select';
import Icon from '../../../components/atoms/Icon';
import Badge from '../../../components/atoms/Badge';
import { formatDate } from '../../../utils/dateUtils';
import './MedicalRequestForm.css';

// Hooks
import { useMedicalRequest } from '../hooks/useMedicalRequest';

// Sub-components
import PrescriptionForm from './PrescriptionForm';
import SimpleRequestForm from './SimpleRequestForm';

/**
 * MedicalRequestForm Organism (Feature-based).
 * Form to create new medical requests (prescriptions, licenses, certificates).
 */
const MedicalRequestForm = ({ doctors, onRequestCreated, initialType, initialSendToDoctor }) => {
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

    const handleSubmit = (e) => {
        handleCreateRequest(e, medicationItems, reqNote);
    };

    if (user.role !== 'secretary' && user.role !== 'doctor') return null;

    const baseClass = 'medical-request-form';

    return (
        <Card title={t('new_request')} className="medical-request-card">
            <form onSubmit={handleSubmit} className={baseClass}>
                <div className={`${baseClass}__row ${baseClass}__row--2`}>
                    <FormGroup label={t('request_type')} required>
                        <Select
                            value={reqType}
                            onChange={e => setReqType(e.target.value)}
                            options={[
                                { value: 'prescription', label: t('prescription') },
                                { value: 'license', label: t('medical_license') },
                                { value: 'certificate', label: t('certificate') || 'Certificado' }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup label={t('doctor_label')} required>
                        {user.role === 'doctor' ? (
                            <div className={`${baseClass}__readonly-value`}>
                                Dr. {user.full_name || user.username}
                            </div>
                        ) : (
                            <Select
                                value={selectedDoctor}
                                onChange={e => setSelectedDoctor(e.target.value)}
                                required
                                options={[
                                    { value: '', label: t('select_doctor') },
                                    ...doctors.map(d => ({ value: d.id, label: `${d.full_name} - ${d.specialty}` }))
                                ]}
                            />
                        )}
                    </FormGroup>
                </div>

                <FormGroup label={t('patient_label')} required>
                    <PatientSearchSelect
                        value={selectedPatient}
                        selectedData={patientData}
                        onChange={(val, patient) => {
                            setSelectedPatient(val);
                            setPatientData(patient);
                        }}
                        placeholder={t('select_patient')}
                    />

                    {patientData && reqType === 'prescription' && patientData.next_suggested_prescription_date && new Date(patientData.next_suggested_prescription_date) > new Date() && (
                        <div className={`${baseClass}__badge-wrapper`}>
                            <Badge variant="warning">
                                <Icon name="warning" size="1rem" />
                                {t('patient_has_valid_until') || 'Cobertura sugerida hasta'}: {formatDate(patientData.next_suggested_prescription_date)}
                            </Badge>
                        </div>
                    )}
                </FormGroup>

                <FormGroup
                    label={reqType === 'prescription' ? t('medication') : (reqType === 'license' ? t('diagnosis') : t('motive'))}
                    required
                >
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
                            baseClass={baseClass}
                        />
                    )}
                </FormGroup>

                <div className={`${baseClass}__panel`}>
                    <div className={`${baseClass}__panel-item`}>
                        <input
                            type="checkbox"
                            className={`${baseClass}__checkbox`}
                            id="req-forward"
                            checked={sendToDoctor}
                            onChange={e => setSendToDoctor(e.target.checked)}
                        />
                        <label htmlFor="req-forward" className={`${baseClass}__panel-label`}>
                            {t('send_to_doctor') || 'Enviar a revisión médica'}
                        </label>
                    </div>

                    <div className={`${baseClass}__panel-item`}>
                        <input
                            type="checkbox"
                            className={`${baseClass}__checkbox`}
                            id="bonified-req"
                            checked={bonified}
                            onChange={e => setBonified(e.target.checked)}
                        />
                        <label htmlFor="bonified-req" className={`${baseClass}__panel-label`}>
                            {t('bonified') || 'Bonificado (Sin costo)'}
                        </label>
                    </div>
                </div>

                <footer className={`${baseClass}__footer`}>
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
        </Card>
    );
};

export default MedicalRequestForm;
