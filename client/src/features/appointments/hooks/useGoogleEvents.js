import { useState, useEffect } from 'react';
import { useMessage } from '@/context/MessageContext';
import api from '@/api/axios';

/**
 * useGoogleEvents (Handler Hook).
 * Manages doctor's schedules and Google Calendar synchronization for specific days.
 */
export const useGoogleEvents = (viewDoctorId, selectedDate, userRole) => {
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const { showMessage } = useMessage();

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!viewDoctorId) { setDoctorSchedule([]); return; }
            try {
                const res = await api.get(`/schedules/${viewDoctorId}`);
                setDoctorSchedule(res.data);
            } catch (err) { /* Fetch failed silently */ }
        };
        fetchSchedule();
    }, [viewDoctorId, selectedDate, userRole]);

    const syncDayToGoogle = async (doctorId, date) => {
        if (!doctorId) { showMessage("Por favor selecciona un doctor", "error"); return; }
        try {
            showMessage("🔄 Sincronizando día con Google Calendar...", "info");
            const dateStr = (date instanceof Date ? date.toISOString() : date).split('T')[0];
            const res = await api.post('/google/sync-day', { doctorId: Number(doctorId), date: dateStr });
            const { created, updated, errors, total } = res.data;
            if (total === 0) showMessage("ℹ️ No hay turnos para sincronizar en este día", "info");
            else if (errors > 0) showMessage(`⚠️ Sincronizado: ${created} creados, ${updated} actualizados, ${errors} errores`, "warning");
            else showMessage(`✅ Éxito: ${created} creados, ${updated} actualizados`, "success");
        } catch (err) {
            showMessage(`❌ ${err.response?.data?.error || "Error sincronizando con Google Calendar"}`, "error");
        }
    };

    return { doctorSchedule, syncDayToGoogle };
};
