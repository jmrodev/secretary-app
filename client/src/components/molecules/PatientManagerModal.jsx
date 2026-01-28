import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import PatientForm from '../organisms/PatientForm';

const PatientManagerModal = ({
    isOpen,
    onClose,
    patient,
    onUpdate,
    referenceInfo,
    insurances: providedInsurances = [],
    doctors: providedDoctors = []
}) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [insurances, setInsurances] = useState(providedInsurances);
    const [doctors, setDoctors] = useState(providedDoctors);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        // If data is provided via props, use it. Otherwise fetch it.
        // This avoids double fetching if the parent already has the data (like Patients.jsx)
        // But ensures standalone usage works too.
        if (isOpen && (insurances.length === 0 || doctors.length === 0)) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    const promises = [];
                    if (insurances.length === 0) promises.push(api.get('/insurances'));
                    if (doctors.length === 0) promises.push(api.get('/users/doctors'));

                    if (promises.length > 0) {
                        const results = await Promise.all(promises);
                        let resultIndex = 0;
                        if (insurances.length === 0) setInsurances(results[resultIndex++].data);
                        if (doctors.length === 0) setDoctors(results[resultIndex++].data);
                    }
                } catch (err) {
                    console.error("Failed to fetch data for modal", err);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isOpen, insurances.length, doctors.length]);

    const handleSubmit = async (formData) => {
        try {
            if (patient && patient.id) {
                // UPDATE
                await api.put(`/users/patients/${patient.id}`, formData);

                const updatedPatient = {
                    ...patient,
                    ...formData,
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name,
                    assignedDoctors: formData.assignedDoctors ? formData.assignedDoctors.map(id => {
                        const doc = doctors.find(d => d.id === id);
                        return doc ? { id: doc.id, full_name: doc.full_name } : { id };
                    }) : []
                };

                showMessage(t('patient_updated') || 'Patient updated successfully', 'success');
                if (onUpdate) onUpdate(updatedPatient);
            } else {
                // CREATE (Register)
                const constructedFullName = formData.full_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

                const payload = {
                    ...formData,
                    fullName: constructedFullName,
                    medicalHistory: formData.medical_history,
                    role: 'patient'
                };

                const res = await api.post('/auth/register', payload);

                // Derive primary phone for UI
                const derivedPhone = formData.phoneNumbers?.find(p => p.is_primary)?.phone_number || formData.phoneNumbers?.[0]?.phone_number || '';

                const newPatient = {
                    id: res.data.patient_id,
                    user_id: res.data.user_id,
                    ...formData,
                    phone: derivedPhone, // Ensure UI sees the phone immediately
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                };

                showMessage(t('patient_created') || 'Patient created successfully', 'success');
                if (onUpdate) onUpdate(newPatient);
            }
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data || t('failed_update') || 'Failed operation';
            showMessage(msg, 'error');
        }
    };

    const isEdit = !!(patient && patient.id);

    // Determine Modal Title
    let title = t('register_new_patient') || 'Register Patient';
    if (isEdit) {
        title = t('edit_patient') || 'Edit Patient';
    }

    const initialValues = patient || {
        phoneNumbers: []
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            {/* Reference Info Block (Existing logic) */}
            {referenceInfo && !isEdit && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">📄 Info de Turno (Referencia)</span>
                    <div className="text-sm font-bold text-amber-900 leading-tight">
                        {referenceInfo}
                    </div>
                </div>
            )}

            {!loadingData ? (
                <PatientForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isEdit={isEdit}
                    isAdmin={true}
                    insurances={insurances}
                    doctors={doctors}
                />
            ) : (
                <div className="p-8 flex justify-center text-gray-400">
                    {t('loading')}
                </div>
            )}
        </Modal>
    );
};

export default PatientManagerModal;
