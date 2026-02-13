
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { capitalizeWords } from '../utils/stringUtils';

export const usePatientFormController = ({
    initialValues,
    onClose,
    onUpdate,
    isEdit,
    providedInsurances = [],
    providedDoctors = []
}) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    // Data State
    const [insurances, setInsurances] = useState(providedInsurances);
    const [doctors, setDoctors] = useState(providedDoctors);
    const [institutions, setInstitutions] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        first_name: '',
        last_name: '',
        dni: '',
        phoneNumbers: [{ phone_number: '+549', label: 'Celular', is_primary: true }],
        email: '',
        address: '',
        street_name: '',
        street_number: '',
        floor: '',
        apartment: '',
        city: 'Tandil',
        province: 'Buenos Aires',
        country: 'Argentina',
        dob: '',
        insurance_id: '',
        institution_id: '',
        affiliate_number: '',
        medical_history: '',
        assignedDoctors: [],
        tariff_percent: '',
        tariff_override: '',
        visit_interval_days: '',
        prescription_interval_days: '',
        next_suggested_visit_date: '',
        next_suggested_prescription_date: '',
        license_expiry_date: ''
    });

    const [coveredByInstitution, setCoveredByInstitution] = useState(false);

    // Initial Load of Resources
    useEffect(() => {
        const fetchResources = async () => {
            setLoadingData(true);
            try {
                const promises = [];
                if (insurances.length === 0) promises.push(api.get('/insurances'));
                if (doctors.length === 0) promises.push(api.get('/users/doctors'));
                promises.push(api.get('/institutions'));

                const results = await Promise.all(promises);
                let idx = 0;
                if (insurances.length === 0) setInsurances(results[idx++].data);
                if (doctors.length === 0) setDoctors(results[idx++].data);
                setInstitutions(results[idx++].data);
            } catch (err) {
                console.error("Failed to fetch form resources", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchResources();
    }, []);

    // Load Initial Values
    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                ...initialValues,
                phoneNumbers: (initialValues.phoneNumbers && initialValues.phoneNumbers.length > 0)
                    ? initialValues.phoneNumbers
                    : [{ phone_number: '+549', label: 'Celular', is_primary: true }],
                assignedDoctors: initialValues.assignedDoctors ?
                    (Array.isArray(initialValues.assignedDoctors) && typeof initialValues.assignedDoctors[0] === 'object'
                        ? initialValues.assignedDoctors.map(d => d.id)
                        : initialValues.assignedDoctors)
                    : []
            }));

            if (initialValues.institution_id) {
                setCoveredByInstitution(true);
            }
        }
    }, [initialValues]);

    // Handlers
    const handlers = {
        handleChange: (e) => {
            let { name, value } = e.target;

            // Apply capitalization if needed
            if (['first_name', 'last_name', 'address', 'street_name', 'city', 'province', 'country'].includes(name)) {
                value = capitalizeWords(value);
            }

            setFormData(prev => {
                // Specialized logic for auto-populating username/password from names
                if (!isEdit && (name === 'first_name' || name === 'last_name')) {
                    const firstName = name === 'first_name' ? value : (prev.first_name || '');
                    const lastName = name === 'last_name' ? value : (prev.last_name || '');

                    // Username/Password should stay lowercase
                    const normalizedFirst = firstName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                    const normalizedLast = lastName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                    const autoValue = `${normalizedFirst}${normalizedLast}`;

                    const oldNormalizedFirst = (prev.first_name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                    const oldNormalizedLast = (prev.last_name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                    const oldAuto = `${oldNormalizedFirst}${oldNormalizedLast}`;

                    const shouldUpdate = !prev.username || prev.username === oldAuto;

                    return {
                        ...prev,
                        [name]: value,
                        full_name: `${firstName} ${lastName}`.trim(),
                        username: shouldUpdate ? autoValue : prev.username,
                        password: shouldUpdate ? autoValue : prev.password
                    };
                }

                return { ...prev, [name]: value };
            });
        },

        handleManualValueChange: (name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
        },

        handleDoctorToggle: (doctorId) => {
            setFormData(prev => {
                const current = prev.assignedDoctors || [];
                const next = current.includes(doctorId)
                    ? current.filter(id => id !== doctorId)
                    : [...current, doctorId];
                return { ...prev, assignedDoctors: next };
            });
        },

        handlePhoneChange: (newPhones) => {
            setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
        },

        handleInstitutionToggle: (checked) => {
            setCoveredByInstitution(checked);
            if (!checked) {
                setFormData(prev => ({ ...prev, institution_id: '' }));
            }
        },

        handleSubmit: async (e) => {
            if (e) e.preventDefault();
            setIsSubmitting(true);

            try {
                if (isEdit && formData.id) {
                    // UPDATE
                    await api.put(`/users/patients/${formData.id}`, formData);

                    const updatedPatient = {
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
                    // CREATE
                    const constructedFullName = formData.full_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
                    const payload = {
                        ...formData,
                        fullName: constructedFullName,
                        medicalHistory: formData.medical_history,
                        role: 'patient'
                    };

                    const res = await api.post('/auth/register', payload);

                    const derivedPhone = formData.phoneNumbers?.find(p => p.is_primary)?.phone_number || formData.phoneNumbers?.[0]?.phone_number || '';

                    const newPatient = {
                        id: res.data.patient_id,
                        user_id: res.data.user_id,
                        ...formData,
                        phone: derivedPhone,
                        insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                    };

                    showMessage(t('patient_created') || 'Patient created successfully', 'success');
                    if (onUpdate) onUpdate(newPatient);
                }
                if (onClose) onClose();
            } catch (err) {
                console.error(err);
                const msg = err.response?.data?.message || err.response?.data || t('failed_update') || 'Failed operation';
                showMessage(msg, 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return {
        // State
        formData,
        insurances,
        doctors,
        institutions,
        coveredByInstitution,
        loadingData,
        isSubmitting,
        t,

        // Handlers
        handlers
    };
};
