import { useFetch } from '@/hooks/useFetch';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

/**
 * ECC-Pattern: Optimized Holidays Hook
 */
export const useHolidays = () => {
    const { showMessage } = useMessage();

    const { 
        data: response, 
        loading, 
        refetch: fetchHolidays 
    } = useFetch('/holidays', {
        initialData: { success: true, data: [] }
    });

    // Extract raw array for components (Calendar, etc.)
    const holidays = response?.data || [];

    const addHoliday = async (date, description) => {
        try {
            await api.post('/holidays', { date, description });
            showMessage('Feriado agregado con éxito', 'success');
            fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || 'Error al agregar feriado';
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        }
    };

    const deleteHoliday = async (id) => {
        try {
            await api.delete(`/holidays/${id}`);
            showMessage('Feriado eliminado', 'success');
            fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            showMessage('Error al eliminar feriado', 'error');
            return { success: false };
        }
    };

    return {
        holidays,
        loading,
        fetchHolidays,
        addHoliday,
        deleteHoliday
    };
};
