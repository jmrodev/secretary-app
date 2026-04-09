import { useState, useEffect } from 'react';
import api from '@/api/axios';
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
            const [reportRes, patientsRes] = await Promise.all([
                api.get(`/institutions/${id}/finances`),
                api.get(`/institutions/${id}/patients`)
            ]);
            setReport(reportRes.data);
            setPatients(patientsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (selectedInstId) {
            fetchReport(selectedInstId);
        } else {
            setReport(null);
            setPatients([]);
        }
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
