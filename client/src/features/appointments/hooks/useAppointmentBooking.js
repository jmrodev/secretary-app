import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/features/auth';
import { capitalizeFirst } from '@/utils/core/stringUtils';
import { formatCurrency } from '@/utils/core/format';

/**
 * Fills a template string with context values.
 * Replaces placeholders like `{key}` with corresponding values from context object.
 */
const fillTemplate = (template, context) => {
    if (!template) return '';
    let result = template;
    Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`{[\\s]*${key}[\\s]*}`, 'gi');
        result = result.replace(regex, value);
    });
    return result;
};

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
    const [reason, setReason] = useState(t('appointment_default_reason'));
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
            if (!selectedPatientData.dni) missing.push(t('dni'));
            if (!selectedPatientData.phone) missing.push(t('phone'));
            if (!selectedPatientData.email) missing.push(t('email'));
            if (!selectedPatientData.street_name) missing.push(t('address'));
            if (!selectedPatientData.insurance_name && !selectedPatientData.insurance_id) {
                missing.push(t('insurance'));
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

    const getBookingContext = useCallback(() => {
        if (!selectedPatientData || !date) return null;
        const apptDateObj = new Date(date);
        const doctor = doctors.find(d => d.id === Number(selectedDoctor));
        const isVirtual = type === 'virtual';

        return {
            patient_name: selectedPatientData.full_name,
            date: apptDateObj.toLocaleDateString(),
            time: apptDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor_name: doctor?.full_name || t('doctor_label'),
            appointment_type: isVirtual ? t('appointment_type_virtual') : t('appointment_type_in_person'),
            appointment_location: isVirtual ? t('virtual_location') : (settings.clinic_address || t('default_clinic_address')),
            price: formatCurrency(isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0)),
            secretary_name: user?.name || t('default_secretary_name')
        };
    }, [selectedPatientData, date, doctors, selectedDoctor, type, settings.clinic_address, user?.name]);

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

            showMessage(t('whatsapp_api_sending'), 'info');
            await api.post('/whatsapp/send', {
                to: phone,
                templateName,
                languageCode: (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) ? 'en' : 'es',
                components
            });
            showMessage(t('whatsapp_api_sent'), 'success');
            return true;
        } catch (err) {
            console.error("Meta API Send Error:", err);
            showMessage(err.response?.data?.error || t('whatsapp_api_error'), 'error');
            return false;
        }
    };

    const resetForm = useCallback(() => {
        setReason(t('appointment_default_reason'));
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
                    reason: reason || t('appointment_default_reason'),
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
                    reason: reason || t('appointment_default_reason'),
                    bonified,
                    is_out_of_hours: isOutOfHours,
                    type,
                    institution_id: selectedInstitution || null
                });
            }

            if (selectedPatient && selectedPatientData?.id) {
                api.put(`/users/patients/${selectedPatientData.id}`, { phone: selectedPatientData.phone })
                   .catch(e => console.error("Failed to auto-update patient phone:", e));
            }

            if (syncingZombieId) {
                api.delete(`/appointments/${syncingZombieId}`).catch(e => console.error("Failed to delete zombie appointment:", e));
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
                            ? t('appointment_confirmation_virtual_default')
                            : t('appointment_confirmation_default');
                    }

                    const message = fillTemplate(template, context);
                    let normalizedPhone = targetPhone.replace(/\D/g, '');
                    if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

                    // Try local bridge if enabled before showing modal
                    if (settings.whatsapp_use_local_bridge === 'true' || settings.whatsapp_use_local_bridge === true) {
                        try {
                            showMessage(t('sending_automated'), 'info');
                            await api.post('/whatsapp/send-direct', { to: normalizedPhone, message });
                            showMessage(t('automated_sent'), 'success');
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
                showMessage(t('no_phone_for_warning'), "warning");
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
            handleDateChange: (e) => setDate(e?.target ? e.target.value : e),
            handleDoctorChange: (e) => setSelectedDoctor(e?.target ? e.target.value : e),
            handlePatientChange: (val, obj) => {
                setSelectedPatient(val);
                setSelectedPatientData(obj);
            },
            handleTypeChange: (val) => setType(val),
            handleInstitutionChange: (e) => setSelectedInstitution(e?.target ? e.target.value : e),
            handleReasonChange: (e) => {
                const val = e?.target ? e.target.value : e;
                setReason(capitalizeFirst(val));
            },
            handleBonifiedChange: (val) => setBonified(val),
            handlePhoneChange: (val) => setSelectedPatientData(prev => ({ ...prev, phone: val })),
            toggleForm: () => setShowForm(prev => !prev),
            createPatient: () => { setSelectedPatientData(null); }
        }
    };
};
