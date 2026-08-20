import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { useAppointments } from '@/features/appointments';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { api } from '@/api/axios';

export const useReportsController = () => {
    const { t } = useLanguage();
    const { alert } = useModal();
    const { getMonthlyReport, isSubmitting } = useAppointments();
    const { doctors, viewDoctorId: selectedDoctorId } = useDoctors();

    // Active tab is derived from the URL (?tab=...) via the router so deep
    // links and browser back/forward work natively. No manual replaceState.
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'appointments'; // appointments | prescriptions | licenses | certificates | balance
    const setActiveTab = useCallback((tab) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    }, [setSearchParams]);

    const [month, setMonth] = useState(() => new Date().getMonth() + 1);
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        if ((activeTab === 'appointments' || activeTab === 'balance') && !selectedDoctorId) {
            setReportData(null);
            setError(t('please_select_doctor') || 'Por favor, seleccione un profesional');
            setIsLoading(false);
            return;
        }
        try {
            if (activeTab === 'appointments') {
                const res = await getMonthlyReport(month, year, selectedDoctorId);
                const actualData = res?.data ?? res;
                setReportData(actualData || { appointments: [] });
            } else if (activeTab === 'prescriptions') {
                const params = { preview: true, month, year, type: 'prescription' };
                if (selectedDoctorId) params.doctorId = selectedDoctorId;
                const response = await api.get('/medical/prescriptions/export/json', { params });
                setReportData(response.data || { prescriptions: [] });
            } else if (activeTab === 'licenses') {
                const params = { preview: true, month, year };
                if (selectedDoctorId) params.doctorId = selectedDoctorId;
                const response = await api.get('/medical/licenses/export/json', { params });
                setReportData(response.data || { licenses: [] });
            } else if (activeTab === 'certificates') {
                const params = { preview: true, month, year };
                if (selectedDoctorId) params.doctorId = selectedDoctorId;
                const response = await api.get('/medical/certificates/export/json', { params });
                setReportData(response.data || { certificates: [] });
            } else if (activeTab === 'balance') {
                const [apptData, presResponse, licResponse, certResponse] = await Promise.all([
                    getMonthlyReport(month, year, selectedDoctorId),
                    api.get('/medical/prescriptions/export/json', {
                        params: { preview: true, month, year, doctorId: selectedDoctorId || undefined }
                    }),
                    api.get('/medical/licenses/export/json', {
                        params: { preview: true, month, year, doctorId: selectedDoctorId || undefined }
                    }),
                    api.get('/medical/certificates/export/json', {
                        params: { preview: true, month, year, doctorId: selectedDoctorId || undefined }
                    })
                ]);

                const actualApptData = apptData?.data ?? apptData;
                setReportData({
                    appointments: actualApptData?.appointments || [],
                    withdrawals: actualApptData?.withdrawals || [],
                    prescriptions: presResponse.data?.prescriptions || [],
                    licenses: licResponse.data?.licenses || [],
                    certificates: certResponse.data?.certificates || []
                });
            }
        } catch (err) {
            console.error(`Error fetching ${activeTab} report:`, err);
            setError(err.message || 'Error fetching report data');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, month, year, selectedDoctorId, getMonthlyReport, t]);

    // Fetch report data on initial mount or when explicit filter params change.
    // Deferred to a microtask: handleGenerateReport sets state synchronously
    // and the rule forbids setState during the effect body.
    useEffect(() => {
        queueMicrotask(() => handleGenerateReport());
    }, [activeTab, month, year, selectedDoctorId, handleGenerateReport]);

    const handleDownloadJson = useCallback(() => {
        if (!reportData) return;
        const jsonString = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${activeTab}_${month}_${year}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [reportData, activeTab, month, year]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const changeMonth = (delta) => {
        let newMonth = month + delta;
        let newYear = year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        setMonth(newMonth);
        setYear(newYear);
    };

    return {
        t,
        activeTab,
        setActiveTab,
        month,
        setMonth,
        year,
        setYear,
        selectedDoctorId,
        reportData,
        error,
        isSubmitting: isSubmitting || isLoading,
        doctors,
        handleGenerateReport,
        handleDownloadJson,
        onPrint: handlePrint,
        changeMonth,
        alert
    };
};

