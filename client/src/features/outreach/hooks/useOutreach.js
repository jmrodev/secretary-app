import { useState, useCallback } from 'react';
import api from '@/api/axios';
import { generateVariants } from '@/features/outreach/utils/variantGenerator';

/**
 * useOutreach — controller hook for the Outreach Message Builder.
 *
 * Manages the 3-step flow: select segment → compose → preview & send.
 */
export const useOutreach = () => {
    // Step 1: Segment selection
    const [segmentType, setSegmentType] = useState('');
    const [dateRange, setDateRangeState] = useState({ startDate: '', endDate: '' });
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Step 2: Message composition
    const [body, setBodyState] = useState('');
    const [variants, setVariants] = useState([]);

    // Step 3: Send progress
    const [sendProgress, setSendProgress] = useState(null);
    const [sendResult, setSendResult] = useState(null);

    /**
     * Set segment type.
     */
    const setSegmentTypeHandler = useCallback((type) => {
        setSegmentType(type);
    }, []);

    /**
     * Set date range for segments that require it.
     */
    const setDateRange = useCallback((startDate, endDate) => {
        setDateRangeState({ startDate, endDate });
    }, []);

    /**
     * Fetch patients for a given segment type.
     */
    const fetchPatients = useCallback(async (type, startDate, endDate) => {
        setLoading(true);
        setError(null);
        try {
            const params = { type };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.get('/outreach/segments', { params });
            const data = res.data;
            setPatients(data.patients || []);
            setLoading(false);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to fetch patients');
            setPatients([]);
            setLoading(false);
            return null;
        }
    }, []);

    /**
     * Set body and clear variants (body change invalidates previous variants).
     */
    const setBody = useCallback((newBody) => {
        setBodyState(newBody);
        setVariants([]);
    }, []);

    /**
     * Generate 3 variants from the current body.
     */
    const generateVariantsHandler = useCallback(() => {
        if (!body || !body.trim()) {
            setVariants([]);
            return;
        }
        const newVariants = generateVariants(body);
        setVariants(newVariants);
    }, [body]);

    /**
     * Send broadcast to all loaded patients.
     */
    const sendBroadcast = useCallback(async () => {
        if (!patients.length || !body) return;

        setSendProgress(0);
        setError(null);
        setSendResult(null);

        try {
            const payload = {
                patient_ids: patients.map(p => p.id),
                body,
                variants
            };

            const res = await api.post('/outreach/send', payload);
            const data = res.data;

            setSendProgress(100);
            setSendResult(data);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to send broadcast');
            setSendProgress(null);
            return null;
        }
    }, [patients, body, variants]);

    return {
        // State
        segmentType,
        dateRange,
        patients,
        body,
        variants,
        sendProgress,
        sendResult,
        loading,
        error,

        // Actions
        setSegmentType: setSegmentTypeHandler,
        setDateRange,
        setPatients,
        fetchPatients,
        setBody,
        generateVariants: generateVariantsHandler,
        sendBroadcast
    };
};
