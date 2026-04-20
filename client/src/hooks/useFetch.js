import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/api/axios';

/**
 * Custom hook for data fetching.
 * Abstracts the boilerplate of loading, error, and data states.
 *
 * @param {string} url - The endpoint URL to fetch from.
 * @param {Object} options - Optional configurations (e.g., params, immediate execution).
 * @param {boolean} options.immediate - Whether to run the fetch immediately on mount (default: true).
 * @param {any} options.initialData - Initial value for the data state.
 * @returns {Object} { data, loading, error, refetch, setData }
 */
export const useFetch = (url, options = {}) => {
    const { immediate = true, initialData, ...apiOptions } = options;
    const apiOptionsKey = useMemo(() => JSON.stringify(apiOptions), [apiOptions]);
    const stableApiOptions = useMemo(() => JSON.parse(apiOptionsKey), [apiOptionsKey]);

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (customUrl) => {
        const finalUrl = customUrl || url;
        if (!finalUrl) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await api.get(finalUrl, stableApiOptions);
            setData(res.data);
            return res.data;
        } catch (err) {
            setError(err);
            console.error(`[useFetch] Error fetching ${finalUrl}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, stableApiOptions]);

    useEffect(() => {
        let isMounted = true;
        if (immediate) {
            queueMicrotask(() => {
                execute().then(res => {
                    if (!isMounted) return;
                    // Side effects if needed
                }).catch(e => {
                    if (!isMounted) return;
                    // Error handled in execute
                });
            });
        }
        return () => {
            isMounted = false;
        };
    }, [execute, immediate]);

    return { data, loading, error, refetch: execute, setData };
};
