import { useFetch } from '@/hooks/useFetch';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

/**
 * Hook to manage national holidays or personal days off within the agenda.
 */
export const useHolidays = () => {
    const { showMessage } = useMessage();

    const { 
        data: holidays = [], 
        loading, 
        refetch: fetchHolidays 
    } = useFetch('/holidays', {
        initialData: []
    });

    const addHoliday = async (date, description) => {
        try {
            await api.post('/holidays', { date, description });
            showMessage('Feriado agregado con éxito', 'success');
            fetchHolidays();
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
