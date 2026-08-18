import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { capitalizeWords } from '@/utils/core/stringUtils';
import { PATIENT_CAPITALIZE_FIELDS } from '@/constants/patientConstants';

/**
 * usePatientFormController (Orchestrator).
 * Manages the state and logic for the PatientForm component.
 * Handles resource fetching (insurances, doctors, institutions), form updates, and submission.
 */
export const usePatientFormController = ({
    initialValues,
    onClose,
    onUpdate,
    isEdit,
    onSubmitOverride,
    providedInsurances = [],
    providedDoctors = []
}) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();

    // Data State (Consolidated for atomic updates)
    const [dataState, dispatchData] = React.useReducer((s, a) => ({ ...s, ...a }), {
        insurances: providedInsurances,
        doctors: providedDoctors,
        institutions: [],
        loadingData: false
    });
    const { insurances, doctors, institutions, loadingData } = dataState;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setLoadingData = (val) => dispatchData({ loadingData: val });

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
            if (loadingData) return;
            setLoadingData(true);
            
            try {
                const fetchInsurances = async () => {
                    if (insurances.length > 0) return;
                    try {
                        const res = await api.get('/insurances');
                        const data = Array.isArray(res.data) ? res.data : (res.data.insurances || []);
                        dispatchData({ insurances: data });
                    } catch (e) { console.error("Error fetching insurances", e); }
                };

                const fetchDoctors = async () => {
                    if (doctors.length > 0) return;
                    try {
                        const res = await api.get('/users/doctors');
                        const data = Array.isArray(res.data) ? res.data : (res.data.doctors || []);
                        dispatchData({ doctors: data });
                    } catch (e) { console.error("Error fetching doctors", e); }
                };

                const fetchInstitutions = async () => {
                    if (institutions.length > 0) return;
                    try {
                        const res = await api.get('/institutions');
                        const data = Array.isArray(res.data) ? res.data : (res.data.institutions || []);
                        dispatchData({ institutions: data });
                    } catch (e) { console.error("Error fetching institutions", e); }
                };

                await Promise.allSettled([
                    fetchInsurances(),
                    fetchDoctors(),
                    fetchInstitutions()
                ]);

            } catch (err) {
                console.error("Failed to fetch form resources", err);
            } finally {
                dispatchData({ loadingData: false });
            }
        };

        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount. State variables inside will check if they need to fetch.

    // Helper to ensure date is YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    };

    // Load Initial Values
    useEffect(() => {
        if (!initialValues) return;
        
        queueMicrotask(() => {
            const sanitized = { ...initialValues };
            
            // Format dates for <input type="date">
            if (sanitized.dob) sanitized.dob = formatDate(sanitized.dob);
            if (sanitized.next_suggested_visit_date) sanitized.next_suggested_visit_date = formatDate(sanitized.next_suggested_visit_date);
            if (sanitized.next_suggested_prescription_date) sanitized.next_suggested_prescription_date = formatDate(sanitized.next_suggested_prescription_date);
            if (sanitized.license_expiry_date) sanitized.license_expiry_date = formatDate(sanitized.license_expiry_date);
            
            // Ensure no null values for controlled inputs
            Object.keys(sanitized).forEach(key => {
                if (sanitized[key] === null) sanitized[key] = '';
            });

            setFormData(prev => ({
                ...prev,
                ...sanitized,
                phoneNumbers: (sanitized.phoneNumbers && sanitized.phoneNumbers.length > 0)
                    ? sanitized.phoneNumbers
                    : [{ phone_number: '+549', label: 'Celular', is_primary: true }],
                assignedDoctors: sanitized.assignedDoctors ?
                    (Array.isArray(sanitized.assignedDoctors) && typeof sanitized.assignedDoctors[0] === 'object'
                        ? sanitized.assignedDoctors.map(d => d.id)
                        : sanitized.assignedDoctors)
                    : []
            }));

            if (sanitized.institution_id) {
                setCoveredByInstitution(true);
            }
        });
    }, [initialValues]);

    // Handlers
    const handlers = {
        updatePatientData: (e) => {
            let { name, value } = e.target;

            // Apply capitalization if needed
            if (PATIENT_CAPITALIZE_FIELDS.includes(name)) {
                value = capitalizeWords(value);
            }

            setFormData(prev => {
                let updatedState = { ...prev, [name]: value };

                // 1. Always update full_name if first_name or last_name change
                if (name === 'first_name' || name === 'last_name') {
                    const firstName = name === 'first_name' ? value : (prev.first_name || '');
                    const lastName = name === 'last_name' ? value : (prev.last_name || '');
                    updatedState.full_name = `${firstName} ${lastName}`.trim();

                    // 2. Only auto-generate username/password if NOT in edit mode (creation)
                    if (!isEdit) {
                        const normalizedFirst = firstName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                        const normalizedLast = lastName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                        const autoValue = `${normalizedFirst}${normalizedLast}`;

                        const oldNormalizedFirst = (prev.first_name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                        const oldNormalizedLast = (prev.last_name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
                        const oldAuto = `${oldNormalizedFirst}${oldNormalizedLast}`;

                        const shouldUpdate = !prev.username || prev.username === oldAuto;

                        if (shouldUpdate) {
                            updatedState.username = autoValue;
                            updatedState.password = autoValue;
                        }
                    }
                }

                return updatedState;
            });
        },

        setPatientValue: (name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
        },

        toggleDoctorAssignment: (doctorId) => {
            setFormData(prev => {
                const current = prev.assignedDoctors || [];
                const next = current.includes(doctorId)
                    ? current.filter(id => id !== doctorId)
                    : [...current, doctorId];
                return { ...prev, assignedDoctors: next };
            });
        },

        updatePhoneNumbers: (newPhones) => {
            setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
        },

        toggleInstitutionCoverage: (checked) => {
            setCoveredByInstitution(checked);
            if (!checked) {
                setFormData(prev => ({ ...prev, institution_id: '' }));
            }
        },

        savePatient: async (e) => {
            if (e) e.preventDefault();
            setIsSubmitting(true);

            try {
                if (isEdit && formData.id) {
                    // External override delegation (e.g. TempAccess)
                    if (onSubmitOverride) {
                        await onSubmitOverride(formData);
                        showMessage(t('patient_updated') || 'Patient updated successfully', 'success');
                        if (onClose) onClose();
                        return;
                    }

                    // Clean payload: exclude computed joins and read-only fields
                    const {
                        insurance_name: _insurance_name,    
                        institution_name: _institution_name,  
                        total_debt: _total_debt,        
                        total_appointments: _total_appointments,
                        missed_appointments: _missed_appointments,
                        role: _role,              
                        ...updatePayload
                    } = formData;

                    // UPDATE
                    await api.put(`/users/patients/${formData.id}`, updatePayload);

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
                    const insuranceName = insurances.find(i => i.id == formData.insurance_id)?.name || 'Particular';

                    const newPatient = {
                        id: res.data.patientId,
                        user_id: res.data.user_id,
                        ...formData,
                        phone: derivedPhone,
                        insurance_name: insuranceName
                    };

                    showMessage(t('patient_created') || 'Patient created successfully', 'success');

                    // SEND WELCOME MESSAGE VIA WHATSAPP BRIDGE
                    if (derivedPhone && (settings.whatsapp_use_local_bridge === 'true' || settings.whatsapp_use_local_bridge === true)) {
                        try {
                            const welcomeTemplate = settings.whatsapp_welcome_template || 
                                "Hola {patient_name}, ¡bienvenido/a! Te confirmamos tu registro con DNI: {dni} y Obra Social: {insurance_name}.";
                            
                            const welcomeMessage = welcomeTemplate
                                .replace(/{patient_name}/g, constructedFullName)
                                .replace(/{dni}/g, formData.dni || 'N/A')
                                .replace(/{insurance_name}/g, insuranceName);

                            let normalizedPhone = derivedPhone.replace(/\D/g, '');
                            if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

                            await api.post('/whatsapp/send-direct', { to: normalizedPhone, message: welcomeMessage });
                            console.log("Welcome WhatsApp sent automatically");
                        } catch (waErr) {
                            console.warn("Failed to send welcome WhatsApp:", waErr);
                        }
                    }

                    if (onUpdate) onUpdate(newPatient);
                }
                if (onClose) onClose();
            } catch (err) {
                console.error(err);
                const msg = err.response?.data?.error 
                    ? t(err.response.data.error) 
                    : (typeof err.response?.data === 'string' ? err.response.data : t('failed_update'));

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
