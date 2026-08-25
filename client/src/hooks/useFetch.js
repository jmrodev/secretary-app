import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/api/axios';

/**
 * ECC-Pattern: Stable useFetch for React 19.
 * Standardizes API calls and ensures hook stability.
 */
export const useFetch = (url, options = {}) => {
    const { immediate = true, initialData, params } = options;
    
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);
    const [fetched, setFetched] = useState(false);

    // Memoize params to avoid infinite loops
    const paramsKey = JSON.stringify(params || {});

    const execute = useCallback(async (customUrl) => {
        const finalUrl = customUrl || url;
        if (!finalUrl) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.get(finalUrl, { params: JSON.parse(paramsKey) });
            const finalData = res.data?.success !== undefined ? res.data : { success: true, data: res.data };
            
            setData(finalData);
            setFetched(true);
            setLoading(false);
            return finalData;
        } catch (err) {
            console.error(`[useFetch] Error:`, err);
            setError(err);
            setLoading(false);
            return null;
        }
    }, [url, paramsKey]);

    useEffect(() => {
        let isMounted = true;
        if (immediate && url) {
            queueMicrotask(() => {
                if (!isMounted) return;
                execute();
            });
        } else if (!immediate && loading) {
            setLoading(false);
        }
        return () => { isMounted = false; };
    }, [url, paramsKey, immediate, execute]);

    return { data, loading, error, fetched, refetch: execute, setData };
};
