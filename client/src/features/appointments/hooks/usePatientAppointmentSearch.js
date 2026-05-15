import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';

/**
 * Hook to search patients and their specific appointment results.
 * Used within the agenda to filter by patient name or phone.
 * 
 * - Only fires a request when the search term has 2+ characters (after 400ms debounce).
 * - Does NOT load all appointments on mount (avoids heavy 600+ row payload).
 */
export const usePatientAppointmentSearch = () => {
    const { searchTerm, setSearchTerm } = useSearch();
    const [searchPatientId, setSearchPatientId] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce: wait 400ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch((searchTerm || '').trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Only search when there's a meaningful term (2+ chars)
    const shouldSearch = debouncedSearch.length >= 2;

    // Main Appointments Search Fetch — only fires when shouldSearch is true
    // Main Appointments Search Fetch
    const appointmentsHook = useFetch('/appointments', {
        params: { search: debouncedSearch },
        initialData: { appointments: [], totalCount: 0 },
        immediate: shouldSearch
    });

    // Patient History Fetch
    const patientHistoryHook = useFetch('/appointments', {
        params: { patientId: searchPatientId },
        initialData: { appointments: [], totalCount: 0 },
        immediate: !!searchPatientId
    });

    return {
        searchTerm, setSearchTerm,
        searchPatientId, setSearchPatientId,
        appointments: shouldSearch ? (appointmentsHook.data?.appointments || []) : [],
        patientAppointments: patientHistoryHook.data?.appointments || [],
        patientApptLoading: patientHistoryHook.loading || (shouldSearch && appointmentsHook.loading),
        fetchAppointments: appointmentsHook.refetch
    };
};
