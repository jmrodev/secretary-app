import { useState, useMemo } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

/**
 * Hook to scan the agenda and find the next available slots for a given doctor.
 */
export const useNextFreeSlot = (doctorId) => {
    const { showMessage } = useMessage();
    const [loading, setLoading] = useState(false);
    const [nextSlotData, setNextSlotData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [includeOutOfHours, setIncludeOutOfHours] = useState(false);
    const [slotsPage, setSlotsPage] = useState(0);
    const [slotHistory, setSlotHistory] = useState([]);
    const slotsPerPage = 8;

    const slotPages = useMemo(() => {
        const pages = [];
        let currentPageSlots = [];

        if (nextSlotData && nextSlotData.results) {
            nextSlotData.results.forEach(day => {
                const daySlots = day.slots.map(slot => ({ ...slot, dayDate: day.date, dayName: day.dayName }));
                currentPageSlots.push(...daySlots);

                if (currentPageSlots.length >= slotsPerPage) {
                    pages.push(currentPageSlots);
                    currentPageSlots = [];
                }
            });
            if (currentPageSlots.length > 0) {
                pages.push(currentPageSlots);
            }
        }
        return pages;
    }, [nextSlotData]);

    const fetchNextFreeSlots = async (startDate = null, overrideOutOfHours = null, append = false) => {
        if (!doctorId) {
            showMessage("Por favor, selecciona un médico primero para buscar turnos.", 'warning');
            return;
        }

        const useOutOfHours = overrideOutOfHours !== null ? overrideOutOfHours : includeOutOfHours;

        try {
            setLoading(true);
            const params = { doctor_id: doctorId, include_out_of_hours: useOutOfHours };
            if (startDate && typeof startDate === 'string') params.start_date = startDate;

            const res = await api.get('/appointments/next-free-batch', { params });

            if (res.data && res.data.results && res.data.results.length > 0) {
                if (append && nextSlotData) {
                    setNextSlotData({
                        results: [...nextSlotData.results, ...res.data.results],
                        nextStartDate: res.data.nextStartDate
                    });
                } else {
                    setNextSlotData(res.data);
                }
                setSlotsPage(0);
                setShowModal(true);
            } else {
                if (!append) {
                    const msg = useOutOfHours ? "No se encontraron turnos libres (ni siquiera fuera de horario)." : "No se encontraron turnos libres. Prueba activando 'Fuera de Horario'.";
                    showMessage(msg, 'info');
                    if (showModal) setNextSlotData({ results: [] });
                }
            }
        } catch (err) {
            showMessage("Error buscando turnos libres.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreSlots = async () => {
        if (nextSlotData?.nextStartDate) {
            await fetchNextFreeSlots(nextSlotData.nextStartDate, null, true);
        }
    };

    const handleNextPage = async () => {
        if (slotsPage < slotPages.length - 1) {
            setSlotsPage(p => p + 1);
        } else if (nextSlotData?.nextStartDate) {
            await fetchNextFreeSlots(nextSlotData.nextStartDate, null, true);
            setSlotsPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (slotHistory.length > 0) {
            const prevDate = slotHistory[slotHistory.length - 1];
            setSlotHistory(prev => prev.slice(0, -1));
            fetchNextFreeSlots(prevDate);
        }
    };

    return {
        loading,
        nextSlotData,
        showModal,
        setShowModal,
        includeOutOfHours,
        setIncludeOutOfHours,
        slotsPage,
        setSlotsPage,
        slotPages,
        fetchNextFreeSlots,
        loadMoreSlots,
        handleNextPage,
        handlePrevPage,
        slotHistory,
        setSlotHistory
    };
};
