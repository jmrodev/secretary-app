import { useState, useCallback } from 'react';
import { api } from '@/api/axios';

/**
 * Service Hook to manage individual appointment API operations.
 * Purely functional, no UI side-effects (messages, modals).
 */
export const useAppointments = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateStatus = async (id, status, reasonOrOnUpdate = null, onUpdateArg = null) => {
        const reason = typeof reasonOrOnUpdate === 'string' ? reasonOrOnUpdate : null;
        const onUpdate = typeof reasonOrOnUpdate === 'function'
            ? reasonOrOnUpdate
            : (typeof onUpdateArg === 'function' ? onUpdateArg : null);
        try {
            setIsSubmitting(true);
            const res = await api.put(`/appointments/${id}/status`, { status, reason });
            if (onUpdate) onUpdate(id, status);
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelAppointment = async (id, onUpdate = null, reason = null) => {
        return updateStatus(id, 'cancelled', reason, onUpdate);
    };

    const deleteAppointment = async (id, apptDataOrOptions = {}, maybeOptions = undefined) => {
        const knownOptionKeys = ['adminPassword', 'viewDoctorId', 'onUpdate'];
        const options = maybeOptions !== undefined
            ? maybeOptions
            : knownOptionKeys.some((k) => Object.prototype.hasOwnProperty.call(apptDataOrOptions, k))
                ? apptDataOrOptions
                : {};
        const { adminPassword, viewDoctorId } = options;
        const onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;
        try {
            setIsSubmitting(true);
            if (String(id).startsWith('goo_')) {
                const eventId = id.replace('goo_', '');
                await api.delete(`/google/appointments/${eventId}`, { data: { doctorId: viewDoctorId } });
            } else {
                await api.delete(`/appointments/${id}`, { data: { adminPassword } });
            }
            if (onUpdate) onUpdate();
            return { success: true };
        } finally {
            setIsSubmitting(false);
        }
    };

    const rescheduleAppointment = async (id, newDate, adminPassword, onUpdate = null) => {
        try {
            setIsSubmitting(true);
            const isoDate = new Date(newDate).toISOString();
            const res = await api.put(`/appointments/${id}`, { appointment_date: isoDate, adminPassword });
            if (onUpdate) onUpdate();
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const savePrescription = async (data, onUpdate = null) => {
        try {
            setIsSubmitting(true);
            const res = await api.post('/medical/prescriptions', {
                appointment_id: data.apptId,
                patientId: data.patientId,
                medications: data.medications,
                instructions: data.instructions,
                items: data.items,
                bonified: data.bonified
            });
            if (onUpdate) onUpdate();
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateAppointment = async (id, data, onUpdate = null) => {
        try {
            setIsSubmitting(true);
            const res = await api.put(`/appointments/${id}`, data);
            if (onUpdate) onUpdate();
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMonthlyReport = useCallback(async (month, year, doctorId = null) => {
        const params = { month, year };
        if (doctorId) params.doctorId = doctorId;
        const response = await api.get('/appointments/month-report', { params });
        return response.data;
    }, []);

    return {
        updateStatus,
        updateAppointment,
        cancelAppointment,
        deleteAppointment,
        rescheduleAppointment,
        savePrescription,
        getMonthlyReport,
        isSubmitting
    };
};
