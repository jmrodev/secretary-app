import { useState, useEffect } from 'react';
import { useMessage } from '../context/MessageContext';
import api from '../api/axios';

export const useGoogleEvents = (viewDoctorId, selectedDate, userRole) => {
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const { showMessage } = useMessage();

    // Fetch doctor schedule only (no Google events)
    useEffect(() => {
        const fetchSchedule = async () => {
            if (!viewDoctorId) {
                setDoctorSchedule([]);
                return;
            }

            try {
                const schedRes = await api.get(`/schedules/${viewDoctorId}`);
                setDoctorSchedule(schedRes.data);
            } catch (err) {
                console.log("Schedule fetch failed", err);
            }
        };

        fetchSchedule();
    }, [viewDoctorId, selectedDate, userRole]);

    const syncDayToGoogle = async (doctorId, date) => {
        if (!doctorId) {
            showMessage("Por favor selecciona un doctor", "error");
            return;
        }

        try {
            showMessage("🔄 Sincronizando día con Google Calendar...", "info");

            // Format date as YYYY-MM-DD
            const dateStr = date instanceof Date
                ? date.toISOString().split('T')[0]
                : date;

            const res = await api.post('/google/sync-day', {
                doctorId: Number(doctorId),
                date: dateStr
            });

            const { created, updated, errors, total } = res.data;

            if (total === 0) {
                showMessage("ℹ️ No hay turnos para sincronizar en este día", "info");
            } else if (errors > 0) {
                showMessage(`⚠️ Sincronizado: ${created} creados, ${updated} actualizados, ${errors} errores`, "warning");
            } else {
                showMessage(`✅ Sincronizado exitosamente: ${created} creados, ${updated} actualizados`, "success");
            }
        } catch (err) {
            console.error("Sync day error:", err);
            const errorMsg = err.response?.data?.error || "Error sincronizando con Google Calendar";
            showMessage(`❌ ${errorMsg}`, "error");
        }
    };

    return { doctorSchedule, syncDayToGoogle };
};
