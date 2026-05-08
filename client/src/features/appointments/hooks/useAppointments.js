import { useState } from 'react';
import api from '@/api/axios';

/**
 * Service Hook to manage individual appointment API operations.
 * Purely functional, no UI side-effects (messages, modals).
 */
export const useAppointments = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateStatus = async (id, status, reason = null) => {
        try {
            setIsSubmitting(true);
            const res = await api.put(`/appointments/${id}/status`, { status, reason });
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAppointment = async (id, options = {}) => {
        const { adminPassword, viewDoctorId } = options;
        try {
            setIsSubmitting(true);
            if (String(id).startsWith('goo_')) {
                const eventId = id.replace('goo_', '');
                await api.delete(`/google/appointments/${eventId}`, { data: { doctorId: viewDoctorId } });
            } else {
                await api.delete(`/appointments/${id}`, { data: { adminPassword } });
            }
            return { success: true };
        } finally {
            setIsSubmitting(false);
        }
    };

    const rescheduleAppointment = async (id, newDate, adminPassword) => {
        try {
            setIsSubmitting(true);
            const isoDate = new Date(newDate).toISOString();
            const res = await api.put(`/appointments/${id}`, { appointment_date: isoDate, adminPassword });
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const savePrescription = async (data) => {
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
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateAppointment = async (id, data) => {
        try {
            setIsSubmitting(true);
            const res = await api.put(`/appointments/${id}`, data);
            return res.data;
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMonthlyReport = async (month, year, doctorId = null) => {
        const params = { month, year };
        if (doctorId) params.doctorId = doctorId;
        const response = await api.get('/appointments/month-report', { params });
        return response.data;
    };

    return {
        updateStatus,
        updateAppointment,
        deleteAppointment,
        rescheduleAppointment,
        savePrescription,
        getMonthlyReport,
        isSubmitting
    };
};
