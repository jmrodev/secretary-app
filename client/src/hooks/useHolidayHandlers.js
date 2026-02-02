import { useCallback } from 'react';

export const useHolidayHandlers = ({
    addHoliday: addHolidayAction,
    deleteHoliday: deleteHolidayAction,
    confirm,
    showMessage,
    t
}) => {

    const handleAddHoliday = useCallback(async (holidayData) => {
        try {
            await addHolidayAction(holidayData);
            showMessage(t('holiday_add_success'), 'success');
        } catch (error) {
            showMessage(t('holiday_add_error'), 'error');
        }
    }, [addHolidayAction, showMessage, t]);

    const handleDeleteHoliday = useCallback(async (id) => {
        if (!await confirm(t('confirm_delete_holiday') || "¿Eliminar este feriado?")) return;
        try {
            await deleteHolidayAction(id);
            showMessage(t('holiday_delete_success'), 'success');
        } catch (error) {
            showMessage(t('holiday_delete_error'), 'error');
        }
    }, [deleteHolidayAction, confirm, showMessage, t]);

    return {
        handleAddHoliday,
        handleDeleteHoliday
    };
};
