import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';

/**
 * Hook to search patients and their specific appointment results.
 * Used within the agenda to filter by patient name or phone.
 */
export const usePatientSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchPatientId, setSearchPatientId] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Main Appointments Fetch
    const { 
        data: appointments = [], 
        refetch: fetchAppointments 
    } = useFetch('/appointments', {
        params: { search: debouncedSearch },
        initialData: []
    });

    // Patient History Fetch
    const { 
        data: patientAppointments = [], 
        loading: patientApptLoading
    } = useFetch('/appointments', {
        params: { patientId: searchPatientId },
        initialData: [],
        immediate: !!searchPatientId
    });

    return {
        searchTerm, setSearchTerm,
        searchPatientId, setSearchPatientId,
        appointments,
        patientAppointments,
        patientApptLoading,
        fetchAppointments
    };
};
