import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';

export const useNextFreeSlot = (doctorId) => {
    const { showMessage } = useMessage();
    const [loading, setLoading] = useState(false);
    const [nextSlotData, setNextSlotData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [includeOutOfHours, setIncludeOutOfHours] = useState(false);
    const [slotsPage, setSlotsPage] = useState(0);
    const [slotHistory, setSlotHistory] = useState([]);
    const [currentSlotParams, setCurrentSlotParams] = useState(null);
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
    }, [nextSlotData, slotsPerPage]);

    const fetchNextFreeSlots = async (startDate = null, overrideOutOfHours = null) => {
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
                setNextSlotData(res.data);
                setSlotsPage(0);
                setShowModal(true);
            } else {
                if (useOutOfHours) {
                    showMessage("No se encontraron turnos libres (ni siquiera fuera de horario).", 'info');
                } else {
                    showMessage("No se encontraron turnos libres. Prueba activando 'Fuera de Horario'.", 'info');
                }
                if (showModal) {
                    setNextSlotData({ results: [] });
                }
            }
        } catch (err) {
            showMessage("Error buscando turnos libres.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (nextSlotData?.nextStartDate) {
            setSlotHistory(prev => [...prev, currentSlotParams]);
            setCurrentSlotParams(nextSlotData.nextStartDate);
            fetchNextFreeSlots(nextSlotData.nextStartDate);
        }
    };

    const handlePrevPage = () => {
        if (slotHistory.length > 0) {
            const prevDate = slotHistory[slotHistory.length - 1];
            setSlotHistory(prev => prev.slice(0, -1));
            setCurrentSlotParams(prevDate);
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
        handleNextPage,
        handlePrevPage,
        slotHistory,
        setSlotHistory
    };
};
