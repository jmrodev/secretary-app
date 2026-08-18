import { useCallback } from 'react';
import { api } from '@/api/axios';

export const useNavigationHandlers = ({
    t,
    showMessage,
    setSearchTerm,
    setActiveTab,
    setRequestsPage,
    setPrescriptionsPage,
    setLicensesPage,
    setRequestsSubTab,
    setActionNote,
    setActionModal,
    setPaymentModal,
    setIsEditing,
    setSelectedPrescription,
    setSelectedLicense,
    setSelectedRequest,
}) => {
    const handleSearchChange = useCallback((val) => setSearchTerm(val), [setSearchTerm]);
    
    const handleTabChange = useCallback((val) => {
        setActiveTab(val);
        setRequestsPage(1);
        setPrescriptionsPage(1);
        setLicensesPage(1);
    }, [setActiveTab, setRequestsPage, setPrescriptionsPage, setLicensesPage]);

    const handlePrescriptionPageChange = useCallback((val) => setPrescriptionsPage(val), [setPrescriptionsPage]);
    const handleLicensePageChange = useCallback((val) => setLicensesPage(val), [setLicensesPage]);
    
    const handleSubTabChange = useCallback((val) => {
        setRequestsSubTab(val);
        setRequestsPage(1);
    }, [setRequestsSubTab, setRequestsPage]);

    const handlePageChange = useCallback((val) => setRequestsPage(val), [setRequestsPage]);
    const handleActionNoteChange = useCallback((val) => setActionNote(val), [setActionNote]);

    const toggleEditing = useCallback((val) => {
        setIsEditing(val);
        if (!val) {
            setSelectedPrescription(null);
            setSelectedLicense(null);
            setSelectedRequest(null);
        }
    }, [setIsEditing, setSelectedPrescription, setSelectedLicense, setSelectedRequest]);

    const closeActionModal = useCallback(() => setActionModal({ open: false, type: '', id: null }), [setActionModal]);
    const openActionModal = useCallback((type, id) => setActionModal({ open: true, type, id }), [setActionModal]);

    const closePaymentModal = useCallback(() => setPaymentModal(prev => ({ ...prev, open: false })), [setPaymentModal]);
    const openPaymentModal = useCallback((data) => setPaymentModal({ open: true, ...data }), [setPaymentModal]);

    const handleExportJSON = useCallback(async () => {
        try {
            const response = await api.get('/medical/prescriptions/export/json', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'prescriptions_backup.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showMessage(t('export_success') || 'Exportación exitosa', 'success');
        } catch {
            showMessage(t('export_failed') || 'Error al exportar', 'error');
        }
    }, [t, showMessage]);

    const handlePrintPrescriptions = useCallback(async (setPrintData) => {
        try {
            const res = await api.get('/medical/prescriptions/export/json?preview=true');
            setPrintData(res.data);
            setTimeout(() => {
                window.print();
            }, 500);
        } catch {
            showMessage(t('print_error') || 'Error al preparar impresión', 'error');
        }
    }, [t, showMessage]);

    return {
        handleSearchChange,
        handleTabChange,
        handleSubTabChange,
        handlePageChange,
        handlePrescriptionPageChange,
        handleLicensePageChange,
        handleActionNoteChange,
        toggleEditing,
        closeActionModal,
        openActionModal,
        closePaymentModal,
        openPaymentModal,
        handleExportJSON,
        handlePrintPrescriptions
    };
};
