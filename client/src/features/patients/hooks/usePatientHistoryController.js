import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/api/axios';

export const usePatientHistoryController = (patientId, isOpen) => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState({
        appointments: [],
        prescriptions: [],
        licenses: [],
        requests: []
    });

    const fetchHistory = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [apptRes, prescRes, licRes, reqRes] = await Promise.all([
                api.get('/appointments', { params: { patientId } }),
                api.get('/medical/prescriptions', { params: { patientId } }),
                api.get('/medical/licenses', { params: { patientId } }),
                api.get('/medical/requests', { params: { patientId } })
            ]);

            setHistory({
                appointments: apptRes.data,
                prescriptions: prescRes.data.prescriptions || [],
                licenses: licRes.data.licenses || [],
                requests: reqRes.data.requests || []
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
