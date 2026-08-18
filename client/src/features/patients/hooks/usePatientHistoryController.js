import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/api/axios';

const unpack = (res) => {
    if (!res || !res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.appointments)) return res.data.appointments;
    if (Array.isArray(res.data.prescriptions)) return res.data.prescriptions;
    if (Array.isArray(res.data.licenses)) return res.data.licenses;
    if (Array.isArray(res.data.requests)) return res.data.requests;
    return [];
};

export const usePatientHistoryController = (patientId, isOpen) => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState({
        appointments: [],
        prescriptions: [],
        licenses: [],
        requests: [],
        files: []
    });

    const fetchHistory = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [apptRes, prescRes, licRes, reqRes, fileRes] = await Promise.all([
                api.get('/appointments', { params: { patientId } }),
                api.get('/medical/prescriptions', { params: { patientId } }),
                api.get('/medical/licenses', { params: { patientId } }),
                api.get('/medical/requests', { params: { patientId } }),
                api.get('/medical/files', { params: { patient_id: patientId } })
            ]);

            setHistory({
                appointments: unpack(apptRes),
                prescriptions: unpack(prescRes),
                licenses: unpack(licRes),
                requests: unpack(reqRes),
                files: unpack(fileRes)
            });
        } catch (err) {
            console.error("Failed to fetch patient history", err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    const fetchHistoryRef = useRef(fetchHistory);
    useEffect(() => {
        fetchHistoryRef.current = fetchHistory;
    }, [fetchHistory]);

    useEffect(() => {
        if (isOpen && patientId) {
            const timer = setTimeout(() => {
                fetchHistoryRef.current();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, patientId]);

    return { history, loading };
};
