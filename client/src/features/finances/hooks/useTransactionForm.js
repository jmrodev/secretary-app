import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { financeService } from '@/features/finances/services/financeService';
import { userService } from '@/features/users/services/userService';
import { getServiceTypes } from '@/constants/transactionOptions';
import { capitalizeFirst } from '@/utils/core/stringUtils';
import { toInputDateTime, getNow } from '@/utils/core/dateUtils';

export const generateAppointmentBitacora = (appt, patientName, paymentAmount = 0) => {
    if (!appt) return '';
    const formatTime = (ts) => {
        if (!ts) return null;
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return null;
        }
    };

    const milestones = [];
    if (appt.created_at) milestones.push(`Creado: ${formatTime(appt.created_at)}`);
    if (appt.confirmed_at) milestones.push(`Conf: ${formatTime(appt.confirmed_at)}`);
    if (appt.arrived_at) milestones.push(`Sala: ${formatTime(appt.arrived_at)}`);
    if (appt.completed_at) milestones.push(`Atendido: ${formatTime(appt.completed_at)}`);
    if (appt.paid_at) milestones.push(`Pagado: ${formatTime(appt.paid_at)}`);

    const totalCost = Number(appt.cost) || 0;
    const prevPaid = Number(appt.paid_amount) || 0;
    const currentPaid = Number(paymentAmount) || 0;
    const totalCobrado = prevPaid + currentPaid;
    const saldoTurno = Math.max(0, totalCost - totalCobrado);

    const name = patientName || appt.patient_name || appt.full_name || '';
    let desc = `Turno - ${name}`;
    if (milestones.length > 0) {
        desc += ` | Hitos: ${milestones.join(', ')}`;
    } else if (appt.appointment_date) {
        desc += ` - ${new Date(appt.appointment_date).toLocaleDateString()}`;
    }

    desc += ` | Total: $${totalCost} | Cobrado: $${totalCobrado} | Saldo: $${saldoTurno}`;
    return desc;
};

export const useTransactionForm = (isOpen, initialData, requestId, onSuccess, onClose) => {
    const { t } = useLanguage();
    const { alert } = useModal();

    // --- State ---
    const [formData, setFormData] = useState(() => ({
        type: 'income_patient',
        payments: [{ _tmpId: Date.now(), amount: '', method: 'cash' }],
        description: '',
        related_user_id: '',
        doctor_id: '',
        status: 'paid',
        service_type: 'consultation',
        proof: null,
        transaction_date: toInputDateTime(getNow())
    }));

    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [pricingInfo, setPricingInfo] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    // Prescription State
    const [medications, setMedications] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Filter/Search State
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);

    // --- Effects ---
    const fetchDoctors = useCallback(async () => {
        try {
            const dData = await userService.getDoctors();
            // The service returns { doctors: [...], totalCount: ... }
            setDoctors(dData.doctors || dData);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        }
    }, []);

    const fetchPricing = useCallback(async (docId, patId, serviceType = 'consultation', initialAmount = null) => {
        if (!docId) return;
        try {
            const data = await financeService.getPricing(docId, patId || null, serviceType);
            if (data && data.price !== undefined) {
                const recommendedPrice = Number(data.price) || 0;
                // Only override if no pre-existing fixed positive initialAmount was provided
                const finalPrice = (initialAmount !== null && initialAmount !== undefined && Number(initialAmount) > 0)
                    ? Number(initialAmount)
                    : recommendedPrice;

                setFormData(prev => {
                    const newPayments = prev.payments.map((p, index) => 
                        index === 0 ? { ...p, amount: finalPrice } : p
                    );
                    return { ...prev, payments: newPayments };
                });
                setTotalPrice(finalPrice);
                if (data.explanation) {
                    setPricingInfo(data.explanation);
                }
            }
        } catch (err) {
            console.error("Failed to fetch pricing", err);
        }
    }, []);

    const initializeData = useCallback(() => {
        const data = initialData || {};
        let initialServiceType = data.serviceType || data.service_type || 'consultation';

        if (initialServiceType === 'virtual') initialServiceType = 'virtual_consultation';
        if (initialServiceType === 'consultation' && data.appointmentType === 'virtual') {
            initialServiceType = 'virtual_consultation';
        }

        const localIso = toInputDateTime(getNow());

        let initialDescription = data.description || '';
        if (data.appointment) {
            initialDescription = generateAppointmentBitacora(data.appointment, data.patientName, data.amount !== undefined ? data.amount : 0);
        }

        const newFormState = {
            type: data.type || 'income_patient',
            payments: data.payments ? data.payments.map(p => ({ ...p, _tmpId: p._tmpId || Math.random() })) : [{ _tmpId: Date.now(), amount: data.amount !== undefined ? data.amount : '', method: data.method || 'cash' }],
            description: initialDescription,
            related_user_id: (data.related_user_id || data.patientUserId) ? String(data.related_user_id || data.patientUserId) : '',
            patient_id: data.patientId || data.patient_id || '',
            doctor_id: data.doctorId ? String(data.doctorId) : '',
            status: data.status || 'paid',
            service_type: initialServiceType,
            proof: null,
            transaction_date: localIso
        };

        if (initialServiceType === 'virtual_consultation' && (!newFormState.description || newFormState.description.includes('Payment for appointment'))) {
            newFormState.description = `Consulta Virtual: ${data.patientName || ''}`;
        }

        setFormData(newFormState);
        setMedications([]); 

        if (data.patientId) {
            // If we have a patientId but not the object, we'll need to fetch it or just use the name from initialData
            if (data.patientName) {
                setPatientSearch(`${data.patientName} (${data.patientDni || 'N/A'})`);
                setSelectedPatient({ id: data.patientId, user_id: data.related_user_id, full_name: data.patientName, dni: data.patientDni });
            }
        } else {
            setPatientSearch('');
            setSelectedPatient(null);
        }

        if (data.amount !== undefined && data.amount !== null && data.amount !== '' && Number(data.amount) > 0) {
            setTotalPrice(Number(data.amount));
        }

        if (data.doctorId) {
            fetchPricing(data.doctorId, data.patientId || null, initialServiceType, data.amount);
        }
    }, [initialData, fetchPricing]);

    useEffect(() => {
        if (!isOpen) return;
        queueMicrotask(() => {
            fetchDoctors();
            initializeData();
        });
    }, [isOpen, initializeData, fetchDoctors]);

    // --- Patient Search Logic ---
    useEffect(() => {
        if (!isOpen || !patientSearch || patientSearch.includes('(')) return; // Skip if modal closed, empty, or already selected (contains parenthesis)
        
        const timer = setTimeout(async () => {
            try {
                const res = await userService.getPatients({ search: patientSearch, limit: 10 });
                setPatients(res.patients || []);
            } catch (err) {
                console.error("Failed to search patients", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [patientSearch, isOpen]);



    // --- Handlers ---
    const updateField = (field, value) => {
        if (field === 'description' && typeof value === 'string') {
            value = capitalizeFirst(value);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateServiceType = (newType) => {
        setFormData(prev => {
            let newDesc = prev.description;
            const pName = selectedPatient ? selectedPatient.full_name : '';

            if (pName) {
                const labels = Object.fromEntries(getServiceTypes(t).map(({ value, label }) => [value, label]));
                const typeLabel = labels[newType] || newType;
                newDesc = `${typeLabel}: ${pName}`;
            }
            return { ...prev, service_type: newType, description: newDesc };
        });

        // Re-fetch pricing when service type changes
        if (formData.doctor_id) {
            fetchPricing(formData.doctor_id, selectedPatient?.id || formData.patient_id || null, newType);
        }
    };

    const updateDoctor = (newDocId) => {
        const docIdStr = newDocId ? String(newDocId) : '';
        setFormData(prev => ({ ...prev, doctor_id: docIdStr }));
        if (docIdStr && formData.type === 'income_patient') {
            fetchPricing(docIdStr, selectedPatient?.id || formData.patient_id || null, formData.service_type);
        }
    };

    const selectPatient = (patient) => {
        const userStr = patient.user_id ? String(patient.user_id) : '';
        setFormData(prev => ({ ...prev, related_user_id: userStr, patient_id: patient.id }));
        setSelectedPatient(patient);
        setPatientSearch(`${patient.full_name} (${patient.dni || 'N/A'})`);
        setShowPatientList(false);
        if (formData.doctor_id) fetchPricing(formData.doctor_id, patient.id, formData.service_type);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = formData.payments.map((p, i) => 
            i === index ? { ...p, [field]: val } : p
        );
        setFormData(prev => ({ ...prev, payments: newPayments }));
    };

    const addPaymentMethod = () => {
        setFormData(prev => ({ ...prev, payments: [...prev.payments, { _tmpId: Date.now(), amount: '', method: 'cash' }] }));
    };

    const removePaymentMethod = (index) => {
        setFormData(prev => ({ ...prev, payments: prev.payments.filter((_, i) => i !== index) }));
    };

    const addMedication = (med) => {
        setMedications(prev => [...prev, med]);
    };

    const removeMedication = (index) => {
        setMedications(prev => prev.filter((_, i) => i !== index));
    };

    const saveTransaction = async () => {
        if (!formData.doctor_id) {
            alert(t('please_select_doctor') || 'Por favor, seleccione un profesional');
            return;
        }
        setLoading(true);
        try {
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'payments') {
                    payload.append(key, JSON.stringify(formData[key]));
                } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    payload.append(key, formData[key]);
                }
            });

            const totalPaid = formData.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

            // Calculate Debt
            if (formData.type === 'income_patient' && totalPrice > 0) {
                const debt = totalPrice - totalPaid;
                if (debt > 0) {
                    payload.append('debt_amount', debt);
                    // Enrich description with partial payment details
                    const existingDesc = payload.get('description') || '';
                    payload.set('description', `${existingDesc} [Pago Parcial: $${totalPaid} / Resto: $${debt}]`);
                }
            }

            // Append meds description if present
            if (medications.length > 0) {
                const medList = medications.map(m => m.name || m.full_label).join(', ');
                const existingDesc = payload.get('description') || '';
                payload.set('description', `${existingDesc} [Meds: ${medList}]`);
            }

            if (requestId) payload.append('request_id', requestId);
            if (initialData?.appointment_id) payload.append('appointment_id', initialData.appointment_id);

            const data = await financeService.createTransaction(payload);
            if (onSuccess) await onSuccess(data);
            onClose();
        } catch (err) {
            const serverMsg = err.response?.data?.error || err.message;
            console.error("Error creating transaction:", serverMsg, err);
            alert((t('failed_record_transaction') || 'Error al guardar') + (serverMsg ? `: ${serverMsg}` : ''));
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        patients,
        doctors,
        pricingInfo,
        totalPrice,
        patientSearch,
        showPatientList,
        selectedPatient,
        medications,

        setPatientSearch,
        setShowPatientList,

        updateField,
        updateServiceType,
        updateDoctor,
        selectPatient,
        handlePaymentChange,
        addPaymentMethod,
        removePaymentMethod,
        saveTransaction,
        addMedication,
        removeMedication,
        setTotalPrice
    };
};
