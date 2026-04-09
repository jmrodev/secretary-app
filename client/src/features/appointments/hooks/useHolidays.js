import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

/**
 * Hook to manage national holidays or personal days off within the agenda.
 */
export const useHolidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showMessage } = useMessage();

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await api.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
            showMessage('Error al cargar feriados', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addHoliday = async (date, description) => {
        try {
            await api.post('/holidays', { date, description });
            showMessage('Feriado agregado con éxito', 'success');
            await fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || 'Error al agregar feriado';
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        }
    };

    const deleteHoliday = async (id) => {
        try {
            await api.delete(`/holidays/${id}`);
            showMessage('Feriado eliminado', 'success');
            await fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            showMessage('Error al eliminar feriado', 'error');
            return { success: false };
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    return {
        holidays,
        loading,
        fetchHolidays,
        addHoliday,
        deleteHoliday
    };
};
