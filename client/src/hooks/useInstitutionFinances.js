import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useMessage } from '../../context/MessageContext';

export const useInstitutionFinances = (institutions) => {
    const { showMessage } = useMessage();

    const [selectedInstId, setSelectedInstId] = useState('');
    const [report, setReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Payment State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'transfer'
    });

    const fetchReport = async (id) => {
        setLoadingReport(true);
        try {
            const res = await api.get(`/institutions/${id}/finances`);
            setReport(res.data);
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
        }
    }, [selectedInstId]);

    const handlePaymentSubmit = async () => {
        try {
            await api.post('/finances/pay-institution-debt', {
                institution_id: selectedInstId,
                amount: paymentData.amount,
                method: paymentData.method
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
        selectedInstId,
        setSelectedInstId,
        report,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    };
};
