import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { financeService } from '@/features/finances/services/financeService';
import { userService } from '@/features/users/services/userService';
import { getServiceTypes } from '@/constants/transactionOptions';
import { capitalizeFirst } from '@/utils/core/stringUtils';
import { toInputDateTime, getNow } from '@/utils/core/dateUtils';

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

    const fetchPricing = useCallback(async (docId, patId, serviceType = 'consultation') => {
        if (!docId || !patId) return;
        try {
            const data = await financeService.getPricing(docId, patId, serviceType);
            if (data) {
                setFormData(prev => {
                    const newPayments = prev.payments.map((p, index) => 
                        index === 0 ? { ...p, amount: data.price } : p
                    );
                    return { ...prev, payments: newPayments };
                });
                setTotalPrice(Number(data.price));
                setPricingInfo(data.explanation);
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

        const newFormState = {
            type: data.type || 'income_patient',
            payments: data.payments ? data.payments.map(p => ({ ...p, _tmpId: p._tmpId || Math.random() })) : [{ _tmpId: Date.now(), amount: data.amount !== undefined ? data.amount : '', method: data.method || 'cash' }],
            description: data.description || '',
            related_user_id: data.related_user_id || data.patientUserId || data.patientId || '',
            doctor_id: data.doctorId || '',
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

        if (data.amount) {
            setTotalPrice(Number(data.amount));
        }

        if (data.doctorId && data.patientId && (!data.amount || Number(data.amount) === 0)) {
            fetchPricing(data.doctorId, data.patientId, initialServiceType);
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
                const labels = getServiceTypes(t).reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), {});
                const typeLabel = labels[newType] || newType;
                newDesc = `${typeLabel}: ${pName}`;
            }
            return { ...prev, service_type: newType, description: newDesc };
        });

        // Re-fetch pricing
        if (formData.doctor_id && selectedPatient) {
            fetchPricing(formData.doctor_id, selectedPatient.id, newType);
        }
    };

    const updateDoctor = (newDocId) => {
        setFormData(prev => ({ ...prev, doctor_id: newDocId }));
        if (formData.type === 'income_patient' && selectedPatient) {
            fetchPricing(newDocId, selectedPatient.id, formData.service_type);
        }
    };

    const selectPatient = (patient) => {
        setFormData(prev => ({ ...prev, related_user_id: patient.user_id }));
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
                } else if (formData[key] !== null) {
                    payload.append(key, formData[key]);
                }
            });

            const totalPaid = formData.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

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
            alert(t('failed_record_transaction') || 'Error al guardar');
            console.error(err);
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
