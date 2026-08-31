import { useFetch } from '@/hooks/useFetch';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * ECC-Pattern: Optimized Holidays Hook
 */
export const useHolidays = () => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();

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
            showMessage(t('holiday_added_success'), 'success');
            fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || t('holiday_add_error');
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        }
    };

    const deleteHoliday = async (id) => {
        try {
            await api.delete(`/holidays/${id}`);
            showMessage(t('holiday_deleted_success'), 'success');
            fetchHolidays();
            return { success: true };
        } catch (err) {
            console.error(err);
            showMessage(t('holiday_delete_error'), 'error');
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
