import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/shared/services/api';
import { Patient } from '@/types/patients';

export const usePatientSearch = () => {
    const [query, setQuery] = useState<string>('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchPatients = useCallback(async (searchTerm: string = '') => {
        try {
            setLoading(true);
            const encoded = encodeURIComponent(searchTerm.trim());
            const res = await apiFetch<any>(`/users/patients?search=${encoded}&limit=40`);
            const rawList = res?.data || res?.patients || [];
            const list: Patient[] = Array.isArray(rawList) ? rawList : [];

            setPatients(list);
            setTotalCount(res?.meta?.totalCount || list.length);
        } catch (err: any) {
            console.error('Error al buscar pacientes:', err);
            setPatients([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Cargar pacientes iniciales al montar
    useEffect(() => {
        fetchPatients('');
    }, [fetchPatients]);

    // Búsqueda reactiva con debounce de 350ms
    const handleQueryChange = (text: string) => {
        setQuery(text);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchPatients(text);
        }, 350);
    };

    const refresh = () => {
        setRefreshing(true);
        fetchPatients(query);
    };

    const clearSearch = () => {
        setQuery('');
        fetchPatients('');
    };

    return {
        query,
        patients,
        loading,
        refreshing,
        totalCount,
        handleQueryChange,
        clearSearch,
        refresh,
    };
};
