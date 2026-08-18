import { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

export const useInstitutionFinances = (institutions, selectedInstId) => {
    const { showMessage } = useMessage();

    const [report, setReport] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'transfer' });

    const fetchReport = async (id) => {
        setLoadingReport(true);
        try {
            // Fetch finances
            try {
                const reportRes = await api.get(`/institutions/${id}/finances`);
                setReport(reportRes.data);
            } catch (err) {
                console.error("Finances Fetch Error:", err);
                setReport(null);
            }

            // Fetch patients
            try {
                const patientsRes = await api.get(`/institutions/${id}/patients`);
                setPatients(patientsRes.data);
            } catch (err) {
                console.error("Patients Fetch Error:", err);
                setPatients([]);
            }
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            if (selectedInstId) {
                fetchReport(selectedInstId);
            } else {
                setReport(null);
                setPatients([]);
            }
        });
    }, [selectedInstId]);

    const handlePaymentSubmit = async () => {
        try {
            await api.post('/finances/pay-institution-debt', {
                institution_id: selectedInstId,
                amount: paymentData.amount,
                method: paymentData.method,
                transaction_ids: paymentData.transaction_ids || []
            });
            showMessage('Pago registrado con éxito', 'success');
            setIsPayModalOpen(false);
            setPaymentData({ amount: '', method: 'transfer' });
            fetchReport(selectedInstId);
        } catch (err) {
            console.error(err);
            showMessage('Error al registrar pago', 'error');
        }
    };

    return {
        report,
        patients,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    };
};
