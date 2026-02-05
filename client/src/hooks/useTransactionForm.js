import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/financeService';
import { userService } from '../services/userService';
import { getServiceTypes } from '../constants/transactionOptions';
import { capitalizeFirst } from '../utils/stringUtils';

export const useTransactionForm = (isOpen, initialData, requestId, onSuccess, onClose) => {
    const { t } = useLanguage();
    const { alert } = useModal();
    const { user } = useAuth();

    // --- State ---
    const [formData, setFormData] = useState({
        type: 'income_patient',
        payments: [{ amount: '', method: 'cash' }],
        description: '',
        related_user_id: '',
        doctor_id: '',
        status: 'paid',
        service_type: 'consultation',
        proof: null,
        transaction_date: new Date().toISOString().slice(0, 16)
    });

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
    useEffect(() => {
        if (!isOpen) return;

        fetchLists();
        initializeData();
    }, [isOpen]);

    const initializeData = () => {
        const data = initialData || {};
        let initialServiceType = data.serviceType || data.service_type || 'consultation';

        if (initialServiceType === 'virtual') initialServiceType = 'virtual_consultation';
        if (initialServiceType === 'consultation' && data.appointmentType === 'virtual') {
            initialServiceType = 'virtual_consultation';
        }

        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const localIso = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);

        const newFormState = {
            type: data.type || 'income_patient',
            payments: data.payments || [{ amount: data.amount || '', method: data.method || 'cash' }],
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
        setMedications([]); // Reset meds on open

        if (data.patientId && patients.length > 0) {
            const preSelected = patients.find(p => p.id === data.patientId);
            if (preSelected) setSelectedPatient(preSelected);
        }

        if (data.amount) {
            setTotalPrice(Number(data.amount));
        }

        if (data.doctorId && data.patientId && !requestId) {
            fetchPricing(data.doctorId, data.patientId, initialServiceType);
        }

        if (data.patientName) {
            setPatientSearch(`${data.patientName} (${data.patientDni || 'N/A'})`);
        } else {
            setPatientSearch('');
        }
    };

    // Update selected patient when patients list loads if initialData provided
    useEffect(() => {
        if (initialData?.patientId && patients.length > 0) {
            const preSelected = patients.find(p => p.id === initialData.patientId);
            if (preSelected) setSelectedPatient(preSelected);
        }
    }, [patients, initialData]);

    const fetchLists = async () => {
        try {
            const [pData, dData] = await Promise.all([
                userService.getPatients(),
                userService.getDoctors()
            ]);
            setPatients(pData);
            setDoctors(dData);
        } catch (err) {
            console.error("Failed to fetch lists", err);
        }
    };

    const fetchPricing = async (docId, patId, serviceType = 'consultation') => {
        if (!docId || !patId) return;
        try {
            const data = await financeService.getPricing(docId, patId, serviceType);
            if (data) {
                setFormData(prev => {
                    const newPayments = [...prev.payments];
                    // Auto-fill amount logic: if empty or single payment, suggest price
                    if (newPayments.length > 0) {
                        newPayments[0].amount = data.price;
                    }
                    return { ...prev, payments: newPayments };
                });
                setTotalPrice(Number(data.price));
                setPricingInfo(data.explanation);
            }
        } catch (err) {
            console.error("Failed to fetch pricing", err);
        }
    };

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
            const pat = patients.find(p => p.user_id === Number(prev.related_user_id));
            const pName = pat ? pat.full_name : '';

            if (pName) {
                const labels = getServiceTypes(t).reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), {});
                const typeLabel = labels[newType] || newType;
                newDesc = `${typeLabel}: ${pName}`;
            }
            return { ...prev, service_type: newType, description: newDesc };
        });

        // Re-fetch pricing
        if (formData.doctor_id && formData.related_user_id) {
            const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
            if (pat) fetchPricing(formData.doctor_id, pat.id, newType);
        }
    };

    const updateDoctor = (newDocId) => {
        setFormData(prev => ({ ...prev, doctor_id: newDocId }));
        if (formData.type === 'income_patient' && formData.related_user_id) {
            const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
            if (pat) fetchPricing(newDocId, pat.id, formData.service_type);
        }
    };

    const selectPatient = (patient) => {
        setFormData(prev => ({ ...prev, related_user_id: patient.user_id }));
        setSelectedPatient(patient);
        setPatientSearch(`${patient.full_name} (${patient.dni || 'N/A'})`);
        setShowPatientList(false);
        if (formData.doctor_id) fetchPricing(formData.doctor_id, patient.id);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...formData.payments];
        newPayments[index][field] = val;
        setFormData({ ...formData, payments: newPayments });
    };

    const addPaymentMethod = () => {
        setFormData(prev => ({ ...prev, payments: [...prev.payments, { amount: '', method: 'cash' }] }));
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

    const handleSubmit = async () => {
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
                if (debt > 0) payload.append('debt_amount', debt);
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
            if (onSuccess) onSuccess(data);
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
        handleSubmit,
        addMedication,
        removeMedication
    };
};
