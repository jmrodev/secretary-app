import { useState, useEffect } from 'react';
import { useMessage } from '../context/MessageContext';
import api from '../api/axios';

export const useGoogleEvents = (viewDoctorId, selectedDate, userRole) => {
    const [googleEvents, setGoogleEvents] = useState([]);
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const { showMessage } = useMessage();

    const refreshGoogleEvents = async (silent = false) => {
        if (!viewDoctorId) {
            setGoogleEvents([]);
            setDoctorSchedule([]);
            return;
        }

        try {
            if (!silent) showMessage("Sincronizando con Google...", "info");

            const schedRes = await api.get(`/schedules/${viewDoctorId}`);
            setDoctorSchedule(schedRes.data);

            const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1).toISOString();
            const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0).toISOString();

            const res = await api.get(`/google/appointments?doctorId=${viewDoctorId}&start=${start}&end=${end}`);

            const mapped = res.data.events.map(e => ({
                id: `goo_${e.id}`,
                patient_name: e.summary || 'Google Event',
                full_name: e.summary || 'Google Event',
                appointment_date: e.start.dateTime || e.start.date,
                status: 'external',
                doctor_id: Number(viewDoctorId),
                source: 'google'
            }));
            setGoogleEvents(mapped);
            if (!silent) showMessage("Google Calendar actualizado.", "success");
        } catch (err) {
            console.log("Google/Schedule Fetch skipped or failed", err);
            if (!silent) showMessage("Error actualizando Google Calendar.", "error");
        }
    };

    useEffect(() => {
        refreshGoogleEvents(true);
    }, [viewDoctorId, selectedDate, userRole]);

    return { googleEvents, doctorSchedule, refreshGoogleEvents };
};
