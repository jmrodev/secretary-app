import { useState, useMemo, useCallback } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

/**
 * ECC-Pattern: useNextFreeSlot Hook (Ultra Optimized)
 * Features: Sequential paging + Direct Month Jumping.
 */
export const useNextFreeSlot = (doctorId) => {
    const { showMessage } = useMessage();
    const [loading, setLoading] = useState(false);
    const [nextSlotData, setNextSlotData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [includeOutOfHours, setIncludeOutOfHours] = useState(false);
    const [slotsPage, setSlotsPage] = useState(0);
    
    const slotsPerPage = 12;

    const slotPages = useMemo(() => {
        const pages = [];
        let currentPageSlots = [];
        if (nextSlotData && nextSlotData.results) {
            nextSlotData.results.forEach(day => {
                day.slots.forEach(slot => {
                    currentPageSlots.push({ ...slot, dayDate: day.date, dayName: day.dayName });
                    if (currentPageSlots.length >= slotsPerPage) {
                        pages.push(currentPageSlots);
                        currentPageSlots = [];
                    }
                });
            });
            if (currentPageSlots.length > 0) pages.push(currentPageSlots);
        }
        return pages;
    }, [nextSlotData]);

    const fetchNextFreeSlots = useCallback(async (startDate = null, overrideOutOfHours = null, append = false) => {
        if (!doctorId) return showMessage("Selecciona un médico primero", 'warning');
        const useOutOfHours = overrideOutOfHours !== null ? overrideOutOfHours : includeOutOfHours;
        try {
            setLoading(true);
            const params = { 
                doctor_id: doctorId, 
                include_out_of_hours: useOutOfHours,
                start_date: startDate && typeof startDate === 'string' ? startDate : undefined
            };
            const res = await api.get('/appointments/next-free-batch', { params });
            const responseData = res.data?.success ? res.data.data : res.data;

            if (responseData?.results?.length > 0) {
                if (append && nextSlotData) {
                    setNextSlotData({
                        results: [...nextSlotData.results, ...responseData.results],
                        nextStartDate: responseData.nextStartDate
                    });
                } else {
                    setNextSlotData(responseData);
                    setSlotsPage(0);
                    setShowModal(true);
                }
            } else {
                if (!append) {
                    showMessage("No se encontraron turnos libres.", 'info');
                    if (showModal) setNextSlotData({ results: [] });
                }
            }
        } catch (err) {
            showMessage("Error buscando turnos libres.", 'error');
        } finally { setLoading(false); }
    }, [doctorId, includeOutOfHours, nextSlotData, showMessage, showModal]);

    const jumpToMonth = useCallback((monthIdx, year) => {
        const firstDayOfMonth = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
        fetchNextFreeSlots(firstDayOfMonth, null, false);
    }, [fetchNextFreeSlots]);

    return {
        loading, nextSlotData, showModal, setShowModal,
        includeOutOfHours, setIncludeOutOfHours: (v) => { setIncludeOutOfHours(v); if (showModal) fetchNextFreeSlots(null, v, false); },
        slotsPage, setSlotsPage, slotPages,
        fetchNextFreeSlots, jumpToMonth,
        hasNextGroup: !!nextSlotData?.nextStartDate
    };
};
