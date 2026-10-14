import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getStoredUser } from '@/shared/services/api';
import { showAlert } from '@/shared/utils/alert';
import { Doctor } from '@/types/appointments';
import { FreeSlotDay, NextFreeSlotsResponse } from '@/types/freeSlots';

export const useNextFreeSlots = (initialDoctorId?: number) => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(initialDoctorId || 10);
    const [isStaff, setIsStaff] = useState<boolean>(false);
    const [includeOutOfHours, setIncludeOutOfHours] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [days, setDays] = useState<FreeSlotDay[]>([]);
    const [nextStartDate, setNextStartDate] = useState<string | null>(null);
    const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

    // Cargar perfil y lista de doctores si aplica
    useEffect(() => {
        const init = async () => {
            const user = await getStoredUser();
            const staff = user?.role === 'secretary' || user?.role === 'admin';
            setIsStaff(staff);

            if (user?.role === 'doctor' && user?.doctor_id) {
                setSelectedDoctorId(user.doctor_id);
            } else {
                try {
                    const res = await apiFetch<any>('/users/doctors');
                    const rawList = res?.data?.doctors || res?.data || res?.doctors || res;
                    const docList: Doctor[] = Array.isArray(rawList) ? rawList : [];
                    setDoctors(docList);
                    if (docList.length > 0 && !initialDoctorId) {
                        const defaultDoc = docList.find((d) => d.id === 10) || docList[0];
                        setSelectedDoctorId(defaultDoc.id);
                    }
                } catch (e) {
                    console.warn('Error al cargar médicos en turnos libres:', e);
                }
            }
        };

        init();
    }, [initialDoctorId]);

    const fetchSlots = useCallback(
        async (
            startDateStr?: string | null,
            outOfHours: boolean = includeOutOfHours,
            append: boolean = false
        ) => {
            if (!selectedDoctorId) return;

            try {
                if (!append) {
                    setLoading(true);
                }

                let query = `/appointments/next-free-batch?doctor_id=${selectedDoctorId}&include_out_of_hours=${outOfHours}`;
                if (startDateStr) {
                    query += `&start_date=${startDateStr}`;
                }

                const res = await apiFetch<any>(query);
                const data: NextFreeSlotsResponse = res?.data || res || { results: [] };
                const fetchedResults = Array.isArray(data.results) ? data.results : [];

                if (append) {
                    setDays((prev) => {
                        const map = new Map<string, FreeSlotDay>();
                        prev.forEach((d) => {
                            map.set(d.date, { ...d, slots: [...d.slots] });
                        });
                        fetchedResults.forEach((newDay) => {
                            if (map.has(newDay.date)) {
                                const existing = map.get(newDay.date)!;
                                const existingTimes = new Set(existing.slots.map((s) => s.time));
                                const freshSlots = newDay.slots.filter(
                                    (s) => !existingTimes.has(s.time)
                                );
                                existing.slots = [...existing.slots, ...freshSlots];
                            } else {
                                map.set(newDay.date, { ...newDay, slots: [...newDay.slots] });
                            }
                        });
                        return Array.from(map.values());
                    });
                } else {
                    setDays(fetchedResults);
                }
                setNextStartDate(data.nextStartDate || null);
            } catch (err: any) {
                console.error('Error al obtener turnos libres:', err);
                showAlert('Error', err.message || 'No se pudieron consultar los turnos libres.');
                if (!append) {
                    setDays([]);
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedDoctorId, includeOutOfHours]
    );

    useEffect(() => {
        if (selectedDoctorId) {
            fetchSlots(null, includeOutOfHours, false);
        }
    }, [selectedDoctorId, includeOutOfHours, fetchSlots]);

    const refresh = () => {
        setRefreshing(true);
        setSelectedMonthOffset(0);
        fetchSlots(null, includeOutOfHours, false);
    };

    const toggleOutOfHours = () => {
        const nextVal = !includeOutOfHours;
        setIncludeOutOfHours(nextVal);
    };

    const loadMore = () => {
        if (nextStartDate && !loading) {
            const nextDateObj = new Date(nextStartDate + 'T12:00:00');
            nextDateObj.setDate(nextDateObj.getDate() + 1);
            const targetDateStr = nextDateObj.toISOString().split('T')[0];
            fetchSlots(targetDateStr, includeOutOfHours, true);
        }
    };

    const jumpToMonth = (monthIndex: number, year: number, offset: number) => {
        setSelectedMonthOffset(offset);
        const targetDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        fetchSlots(targetDate, includeOutOfHours, false);
    };

    const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

    return {
        doctors,
        selectedDoctorId,
        setSelectedDoctorId,
        selectedDoctor,
        isStaff,
        includeOutOfHours,
        toggleOutOfHours,
        loading,
        refreshing,
        days,
        nextStartDate,
        selectedMonthOffset,
        refresh,
        loadMore,
        jumpToMonth,
    };
};
