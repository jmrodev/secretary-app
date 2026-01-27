import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to manage the appointment booking lifecycle.
 * Handles form state, validation, saving, zombie cleanup, and confirmation messaging.
 */
export const useAppointmentBooking = (doctors) => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const { user } = useAuth();

    // --- FORM STATE ---
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPatientData, setSelectedPatientData] = useState(null);
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('Consulta');
    const [bonified, setBonified] = useState(false);
    const [type, setType] = useState('consultation');
    const [selectedInstitution, setSelectedInstitution] = useState('');
    const [syncingZombieId, setSyncingZombieId] = useState(null);
    const [syncReferenceInfo, setSyncReferenceInfo] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [missingData, setMissingData] = useState([]);
    const [whatsappModal, setWhatsappModal] = useState({ open: false, phone: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- VALIDATION & SYNC ---

    // Check for missing patient info for quality tracking
    useEffect(() => {
        if (!selectedPatientData) {
            setMissingData([]);
            return;
        }
        const missing = [];
        if (!selectedPatientData.dni) missing.push(t('dni') || 'DNI');
        if (!selectedPatientData.phone) missing.push(t('phone') || 'Teléfono');
        if (!selectedPatientData.email) missing.push('Email');
        if (!selectedPatientData.address) missing.push(t('address') || 'Dirección');
        if (!selectedPatientData.insurance_name && !selectedPatientData.insurance && !selectedPatientData.insurance_id) {
            missing.push('Obra Social');
        }
        setMissingData(missing);
    }, [selectedPatientData, t]);

    // Sync institution from patient data
    useEffect(() => {
        if (selectedPatientData?.institution_id) {
            setSelectedInstitution(selectedPatientData.institution_id);
        }
    }, [selectedPatientData]);

    // --- PRIVATE UTILS ---

    const formatCurrency = (val) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const getBookingContext = useCallback(() => {
        if (!selectedPatientData || !date) return null;

        const apptDateObj = new Date(date);
        const doctor = doctors.find(d => d.id === Number(selectedDoctor));
        const isVirtual = type === 'virtual';

        return {
            patient_name: selectedPatientData.full_name,
            date: apptDateObj.toLocaleDateString(),
            time: apptDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor_name: doctor?.full_name || 'Doctor',
            appointment_type: isVirtual ? 'VIRTUAL' : 'PRESENCIAL',
            appointment_location: isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255'),
            price: formatCurrency(isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0)),
            secretary_name: user?.name || 'Secretaría'
        };
    }, [selectedPatientData, date, doctors, selectedDoctor, type, settings.clinic_address, user?.name]);

    const fillTemplate = (template, context) => {
        if (!template) return '';
        let result = template;
        Object.entries(context).forEach(([key, value]) => {
            const regex = new RegExp(`{[\\s]*${key}[\\s]*}`, 'gi');
            result = result.replace(regex, value);
        });
        return result;
    };

    const handleMetaSend = async (phone, context) => {
        const templateName = settings.meta_confirmation_template_name;
        const paramsOrder = settings.meta_confirmation_params_order;

        if (!settings.meta_phone_number_id || !templateName || !paramsOrder) return false;

        try {
            const paramKeys = paramsOrder.split(',').map(s => s.trim());
            const components = [{
                type: 'body',
                parameters: paramKeys.map(key => {
                    const rawKey = key.replace('{', '').replace('}', '');
                    return { type: 'text', text: String(context[rawKey] || '') };
                })
            }];

            showMessage('Enviando mensaje por WhatsApp API...', 'info');
            await api.post('/whatsapp/send', {
                to: phone,
                templateName,
                languageCode: 'es',
                components
            });
            showMessage('Mensaje enviado por API correctamente', 'success');
            return true;
        } catch (err) {
            console.error("Meta API Send Error:", err);
            showMessage(err.response?.data?.error || 'Error enviando por Meta API', 'error');
            return false;
        }
    };

    // --- PUBLIC ACTIONS ---

    const resetForm = useCallback(() => {
        setReason('Consulta');
        setDate('');
        setType('consultation');
        setSelectedInstitution('');
        setSyncReferenceInfo(null);
        setSyncingZombieId(null);
        setBonified(false);
    }, []);

    const bookAppointment = async (onSuccess) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            // 1. Create Appointment
            await api.post('/appointments', {
                doctor_id: selectedDoctor,
                patient_id: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                appointment_date: new Date(date).toISOString(),
                reason: reason || 'Consulta',
                bonified,
                type,
                institution_id: selectedInstitution || null
            });

            // 2. Cleanup Zombie (if from Google Sync)
            if (syncingZombieId) {
                api.delete(`/appointments/${syncingZombieId}`).catch(e => console.warn("Failed to delete zombie:", e));
                setSyncingZombieId(null);
            }

            showMessage(t('appointment_booked'), 'success');
            setShowForm(false);

            // 3. Confirmation Flow
            const context = getBookingContext();

            // Resolve phone from any available field
            // Resolve phone from any available field (including array from backend)
            let targetPhone = selectedPatientData?.phone || selectedPatientData?.mobile_phone || selectedPatientData?.contact_info;

            // Fallback to phoneNumbers array if primary phone is missing
            if (!targetPhone && selectedPatientData?.phoneNumbers && Array.isArray(selectedPatientData.phoneNumbers)) {
                const primary = selectedPatientData.phoneNumbers.find(p => p.is_primary);
                if (primary) targetPhone = primary.phone_number;
                else if (selectedPatientData.phoneNumbers.length > 0) targetPhone = selectedPatientData.phoneNumbers[0].phone_number;
            }

            if (context && targetPhone) {
                // Try Meta API first
                const sentViaMeta = await handleMetaSend(targetPhone, context);

                // Fallback to manual WhatsApp Modal if Meta API failed or is not configured
                if (!sentViaMeta) {
                    const isVirtual = type === 'virtual';
                    let template = (isVirtual && settings.appointment_confirmation_virtual_template)
                        ? settings.appointment_confirmation_virtual_template
                        : settings.appointment_confirmation_template;

                    if (!template?.trim()) {
                        template = isVirtual
                            ? `Hola {patient_name}, te confirmamos tu turno VIRTUAL para el día {date} a las {time} con el/la Dr/a. {doctor_name}.`
                            : `Hola {patient_name}, te confirmamos tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name} en {appointment_location}.`;
                    }

                    setWhatsappModal({
                        open: true,
                        phone: targetPhone,
                        message: fillTemplate(template, context)
                    });
                }
            } else if (!targetPhone) {
                console.warn("No phone found for patient, skipping WhatsApp confirmation.");
                showMessage(t('no_phone_for_warning') || "Turno creado, pero el paciente no tiene teléfono para enviar confirmación.", "warning");
            }

            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.error || t('failed_book'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        // Form states
        selectedDoctor, setSelectedDoctor,
        selectedPatient, setSelectedPatient,
        selectedPatientData, setSelectedPatientData,
        date, setDate,
        reason, setReason,
        bonified, setBonified,
        type, setType,
        selectedInstitution, setSelectedInstitution,
        syncingZombieId, setSyncingZombieId,
        syncReferenceInfo, setSyncReferenceInfo,
        showForm, setShowForm,

        // Computed/Status
        missingData,
        whatsappModal, setWhatsappModal,
        isSubmitting,

        // Actions
        bookAppointment,
        resetForm
    };
};
