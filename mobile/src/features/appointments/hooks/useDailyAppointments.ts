import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getStoredUser } from '@/shared/services/api';
import { showAlert } from '@/shared/utils/alert';
import { Appointment, AppointmentStats, Doctor } from '@/types/appointments';
import { User } from '@/types/auth';

export const useDailyAppointments = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [stats, setStats] = useState<AppointmentStats>({ total: 0, attended: 0, pending: 0 });

    const [user, setUser] = useState<User | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(10);
    const [isStaff, setIsStaff] = useState<boolean>(false);

    // Inicializar usuario y doctores si es secretaria o admin
    useEffect(() => {
        const init = async () => {
            const storedUser = await getStoredUser();
            setUser(storedUser);

            const staffRole = storedUser?.role === 'secretary' || storedUser?.role === 'admin';
            setIsStaff(staffRole);

            if (storedUser?.role === 'doctor' && storedUser?.doctor_id) {
                setSelectedDoctorId(storedUser.doctor_id);
            } else {
                // Para secretaria o admin: obtener lista de médicos
                try {
                    const res = await apiFetch<any>('/users/doctors');
                    const rawList = res?.data?.doctors || res?.data || res?.doctors || res;
                    const docList: Doctor[] = Array.isArray(rawList) ? rawList : [];
                    setDoctors(docList);
                    if (docList.length > 0) {
                        const defaultDoc = docList.find((d) => d.id === 10) || docList[0];
                        setSelectedDoctorId(defaultDoc.id);
                    }
                } catch (e) {
                    console.warn('Error loading doctors list for secretary:', e);
                }
            }
        };

        init();
    }, []);

    const changeDate = (days: number) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + days);
        setSelectedDate(next);
    };

    const fetchDailyAppointments = useCallback(
        async (dateObj: Date = selectedDate, docId: number = selectedDoctorId) => {
            try {
                setLoading(true);

                const formattedDate = dateObj.toISOString().split('T')[0];
                const data = await apiFetch<any>(
                    `/appointments/daily-schedule?date=${formattedDate}&doctorId=${docId}`
                );

                const rawList = data?.data || data?.schedule || data || [];
                const list: Appointment[] = Array.isArray(rawList)
                    ? rawList.filter(
                          (item: Appointment) =>
                              item.patient_name &&
                              item.patient_name !== 'Desconocido' &&
                              !item.patient_name.includes('(Sin Paciente)')
                      )
                    : [];

                setAppointments(list);

                const attended = list.filter(
                    (a) =>
                        a.status === 'attended' ||
                        a.status === 'completado' ||
                        a.status === 'completed'
                ).length;

                setStats({
                    total: list.length,
                    attended,
                    pending: list.length - attended,
                });
            } catch (error: any) {
                console.error('Error al cargar turnos:', error.message);
                setAppointments([]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedDate, selectedDoctorId]
    );

    useEffect(() => {
        if (selectedDoctorId) {
            fetchDailyAppointments(selectedDate, selectedDoctorId);
        }
    }, [selectedDate, selectedDoctorId, fetchDailyAppointments]);

    const refresh = () => {
        setRefreshing(true);
        fetchDailyAppointments(selectedDate, selectedDoctorId);
    };

    const updateAppointmentStatus = async (
        id: number,
        status: string,
        reason?: string
    ): Promise<boolean> => {
        try {
            await apiFetch(`/appointments/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, reason }),
            });
            await fetchDailyAppointments(selectedDate, selectedDoctorId);
            return true;
        } catch (err: any) {
            console.error('Error al actualizar estado del turno:', err);
            showAlert('Error', err.message || 'No se pudo actualizar el estado del turno.');
            return false;
        }
    };

    const registerPayment = async (
        appointmentId: number,
        data: {
            amount: number;
            method: string;
            doctorId: number;
            patientId?: number | null;
            notes?: string;
        }
    ): Promise<boolean> => {
        try {
            await apiFetch('/finances/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    appointment_id: appointmentId,
                    doctor_id: data.doctorId,
                    patient_id: data.patientId || null,
                    amount: data.amount,
                    method: data.method,
                    type: 'income_patient',
                    description: data.notes || 'Cobro de turno (app móvil)',
                }),
            });
            await fetchDailyAppointments(selectedDate, selectedDoctorId);
            return true;
        } catch (err: any) {
            console.error('Error al registrar transacción:', err);
            // Fallback: intentar actualizar el estado de pago del turno directamente
            try {
                await apiFetch(`/appointments/${appointmentId}/payment`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'paid' }),
                });
                await fetchDailyAppointments(selectedDate, selectedDoctorId);
                return true;
            } catch (fallbackErr: any) {
                console.error('Error al actualizar estado de pago fallback:', fallbackErr);
                showAlert('Error', err.message || 'No se pudo registrar el cobro.');
                return false;
            }
        }
    };

    const updatePaymentStatus = async (
        appointmentId: number,
        status: string
    ): Promise<boolean> => {
        try {
            await apiFetch(`/appointments/${appointmentId}/payment`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            await fetchDailyAppointments(selectedDate, selectedDoctorId);
            return true;
        } catch (err: any) {
            console.error('Error al actualizar estado de pago:', err);
            showAlert('Error', err.message || 'No se pudo actualizar el estado de pago.');
            return false;
        }
    };

    return {
        selectedDate,
        setSelectedDate,
        appointments,
        loading,
        refreshing,
        stats,
        changeDate,
        refresh,
        doctors,
        selectedDoctorId,
        setSelectedDoctorId,
        isStaff,
        user,
        updateAppointmentStatus,
        registerPayment,
        updatePaymentStatus,
    };
};
