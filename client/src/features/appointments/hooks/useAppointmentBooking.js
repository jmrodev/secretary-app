import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/features/auth';
import { capitalizeFirst } from '@/utils/core/stringUtils';

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
    const [editModeId, setEditModeId] = useState(null);
    const [isOutOfHours, setIsOutOfHours] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [missingData, setMissingData] = useState([]);
    const [whatsappModal, setWhatsappModal] = useState({ open: false, phone: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for missing patient info for quality tracking
    useEffect(() => {
        queueMicrotask(() => {
            if (!selectedPatientData) {
                setMissingData([]);
                return;
            }
            const missing = [];
            if (!selectedPatientData.dni) missing.push(t('dni') || 'DNI');
            if (!selectedPatientData.phone) missing.push(t('phone') || 'Teléfono');
            if (!selectedPatientData.email) missing.push(t('email') || 'Email');
            if (!selectedPatientData.street_name) missing.push(t('address') || 'Dirección');
            if (!selectedPatientData.insurance_name && !selectedPatientData.insurance_id) {
                missing.push(t('insurance') || 'Obra Social');
            }
            setMissingData(missing);
        });
    }, [selectedPatientData, t]);

    // Sync institution from patient data
    useEffect(() => {
        if (selectedPatientData?.institution_id) {
            queueMicrotask(() => setSelectedInstitution(selectedPatientData.institution_id));
        }
    }, [selectedPatientData]);

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

    const resetForm = useCallback(() => {
        setReason('Consulta');
        setDate('');
        setType('consultation');
        setSelectedInstitution('');
        setSyncReferenceInfo(null);
        setSyncingZombieId(null);
        setEditModeId(null);
        setIsOutOfHours(false);
        setBonified(false);
    }, []);

    const bookAppointment = async (onSuccess) => {
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            if (editModeId) {
                await api.put(`/appointments/${editModeId}`, {
                    doctor_id: selectedDoctor,
                    patientId: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                    appointment_date: new Date(date).toISOString(),
                    reason: reason || 'Consulta',
                    bonified,
                    is_out_of_hours: isOutOfHours,
                    type,
                    institution_id: selectedInstitution || null
                });
            } else {
                await api.post('/appointments', {
                    doctor_id: selectedDoctor,
                    patientId: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                    appointment_date: new Date(date).toISOString(),
                    reason: reason || 'Consulta',
                    bonified,
                    is_out_of_hours: isOutOfHours,
                    type,
                    institution_id: selectedInstitution || null
                });
            }

            if (selectedPatient && selectedPatientData?.id) {
                api.put(`/users/patients/${selectedPatientData.id}`, { phone: selectedPatientData.phone })
                   .catch(e => console.warn("Auto-updating phone failed (swallowed):", e));
            }

            if (syncingZombieId) {
                api.delete(`/appointments/${syncingZombieId}`).catch(e => console.warn("Failed to delete zombie:", e));
                setSyncingZombieId(null);
            }

            showMessage(t('appointment_booked'), 'success');
            setShowForm(false);

            const context = getBookingContext();
            let targetPhone = selectedPatientData?.phone || selectedPatientData?.mobile_phone || selectedPatientData?.contact_info;
            if (!targetPhone && selectedPatientData?.phoneNumbers && Array.isArray(selectedPatientData.phoneNumbers)) {
                const primary = selectedPatientData.phoneNumbers.find(p => p.is_primary);
                targetPhone = primary ? primary.phone_number : (selectedPatientData.phoneNumbers[0]?.phone_number);
            }

            if (context && targetPhone) {
                const sentViaMeta = await handleMetaSend(targetPhone, context);
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

                    const message = fillTemplate(template, context);
                    let normalizedPhone = targetPhone.replace(/\D/g, '');
                    if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

                    // Try local bridge if enabled before showing modal
                    if (settings.whatsapp_use_local_bridge === 'true' || settings.whatsapp_use_local_bridge === true) {
                        try {
                            showMessage(t('sending_automated') || 'Enviando confirmación automática...', 'info');
                            await api.post('/whatsapp/send-direct', { to: normalizedPhone, message });
                            showMessage(t('automated_sent') || 'Confirmación enviada por WhatsApp', 'success');
                            resetForm();
                            if (onSuccess) onSuccess();
                            return; // Success! No need for modal.
                        } catch (bridgeErr) {
                            console.error("Local Bridge confirmation failed:", bridgeErr);
                            // If bridge fails, we continue to the modal
                        }
                    }

                    setWhatsappModal({
                        open: true,
                        phone: targetPhone,
                        message: message
                    });
                }
            } else if (!targetPhone) {
                showMessage(t('no_phone_for_warning') || "Turno creado, pero el paciente no tiene teléfono para enviar confirmación.", "warning");
            }

            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : t('failed_book'));
            showMessage(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
        editModeId, setEditModeId,
        isOutOfHours, setIsOutOfHours,
        showForm, setShowForm,
        missingData,
        whatsappModal, setWhatsappModal,
        isSubmitting,
        bookAppointment,
        resetForm,
        handlers: {
            handleDateChange: (val) => setDate(val),
            handleDoctorChange: (val) => setSelectedDoctor(val),
            handlePatientChange: (val, obj) => {
                setSelectedPatient(val);
                setSelectedPatientData(obj);
            },
            handleTypeChange: (val) => setType(val),
            handleInstitutionChange: (val) => setSelectedInstitution(val),
            handleReasonChange: (val) => setReason(capitalizeFirst(val)),
            handleBonifiedChange: (val) => setBonified(val),
            handlePhoneChange: (val) => setSelectedPatientData(prev => ({ ...prev, phone: val })),
            toggleForm: () => setShowForm(prev => !prev),
            createPatient: () => { setSelectedPatientData(null); }
        }
    };
};
