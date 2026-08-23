import { useState } from 'react';
import { api } from '@/api/axios';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useFetch } from '@/hooks/useFetch';

/**
 * useRentalsController Hook (Orchestrator).
 * Manages the data and logic for the Rentals feature.
 */
export const useRentalsController = () => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { user } = useAuth();

    // --- State ---
    const [selectedOffice, setSelectedOffice] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // --- Data Fetching ---

    // Consultorios (Offices)
    const { 
        data: consultorios = [], 
        loading: consultoriosLoading, 
        refetch: fetchConsultorios 
    } = useFetch('/consultorios', { initialData: [] });

    // My Rentals (for Doctors)
    const { 
        data: rentals = [], 
        loading: rentalsLoading, 
        refetch: fetchRentals 
    } = useFetch('/consultorios/my-rentals', {
        initialData: [],
        immediate: user?.role === 'doctor'
    });

    const loading = consultoriosLoading || rentalsLoading;

    // --- Handlers ---

    const handleRent = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.post('/consultorios/rent', {
                consultorio_id: selectedOffice,
                rental_date: date,
                start_time: startTime,
                end_time: endTime,
                cost: 50.00 // Fixed cost for demo
            });

            showMessage(t('rental_booked'), 'success');
            
            // Refresh data
            fetchRentals();
            fetchConsultorios();

            // Reset form
            setSelectedOffice('');
            setDate('');
            setStartTime('');
            setEndTime('');
        } catch (err) {
            console.error(err);
            showMessage(t('failed_book_rental'), 'error');
        }
    };

    return {
        user,
        t,
        consultorios,
        rentals,
        loading,
        selectedOffice,
        setSelectedOffice,
        date,
        setDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        handleRent
    };
};
