import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import PatientForm from './PatientForm'; // [NEW]

const PatientEditModal = ({ isOpen, onClose, patient, onUpdate }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [insurances, setInsurances] = useState([]);
    const [doctors, setDoctors] = useState([]); // [NEW]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [insRes, docRes] = await Promise.all([
                    api.get('/insurances'),
                    api.get('/users/doctors')
                ]);
                setInsurances(insRes.data);
                setDoctors(docRes.data);
            } catch (err) {
                console.error("Failed to fetch data for modal", err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (formData) => {
        try {
            if (patient && patient.id) {
                // UPDATE
                await api.put(`/users/patients/${patient.id}`, formData);
                showMessage(t('patient_updated') || 'Patient updated successfully', 'success');

                const updatedPatient = {
                    ...patient,
                    ...formData,
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                };
                onUpdate(updatedPatient);
            } else {
                // CREATE (Register)
                // PatientForm handles validation (username/password required for new)

                // If the user wants the convenience of auto-generated username/password from DNI 
                // like the old modal, they might be annoyed. 
                // But PatientForm requires them. 
                // For now, we respect PatientForm's fields.

                const constructedFullName = formData.full_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

                const payload = {
                    ...formData,
                    fullName: constructedFullName, // Ensure fullName is present
                    medicalHistory: formData.medical_history, // Map for backend
                    role: 'patient'
                };

                const res = await api.post('/auth/register', payload);
                showMessage(t('patient_created') || 'Patient created successfully', 'success');

                const newPatient = {
                    id: res.data.patient_id,
                    user_id: res.data.user_id,
                    ...formData,
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                };
                onUpdate(newPatient);
            }
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data || t('failed_update') || 'Failed operation';
            showMessage(msg, 'error');
        }
    };

    const isEdit = !!(patient && patient.id);

    // If creating, patient might accept { full_name: '..' } from convenience
    const initialValues = patient || {};

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? (t('edit_patient') || 'Edit Patient') : (t('register_new_patient') || 'Register Patient')}
            size="lg" // Make it larger for the full form
        >
            <PatientForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isEdit={isEdit}
                isAdmin={true} // Allow advanced fields (since secretary/admin uses this)
                insurances={insurances}
                doctors={doctors}
            />
        </Modal>
    );
};

export default PatientEditModal;
