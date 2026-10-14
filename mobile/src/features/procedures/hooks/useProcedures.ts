import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getStoredUser } from '@/shared/services/api';
import { MedicalProcedure, ProcedureType, ProcedureStatus } from '@/types/procedures';

export type FilterType = 'all' | ProcedureType;
export type FilterStatus = 'pending' | 'completed' | 'all';
// Doctor scope filter: null = default single-doctor scope (x-doctor-id header),
// a numeric id = that doctor only, 'all' = every doctor (secretary/admin).
export type FilterDoctor = number | 'all' | null;

export interface DoctorOption {
    id: number;
    full_name: string;
}

export const useProcedures = () => {
    const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
    const [doctorFilter, setDoctorFilter] = useState<FilterDoctor>(null);
    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [defaultScopeResolved, setDefaultScopeResolved] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Resolve the default doctor scope from the stored user role:
    // staff (non-doctor) see every doctor's requests by default ('all'),
    // doctors (or unknown role) keep the header-scoped default (null).
    useEffect(() => {
        let cancelled = false;
        getStoredUser()
            .then((user) => {
                if (!cancelled && user?.role && user.role !== 'doctor') {
                    setDoctorFilter('all');
                }
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setDefaultScopeResolved(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Load doctor options once (same /users/doctors pattern as CreateRequestModal)
    useEffect(() => {
        apiFetch<{ data: { doctors: DoctorOption[] } }>('/users/doctors')
            .then((res) => {
                const list: DoctorOption[] =
                    Array.isArray(res) ? res :
                    Array.isArray((res as any)?.data) ? (res as any).data :
                    (res as any)?.data?.doctors ?? [];
                setDoctors(list);
            })
            .catch(() => setDoctors([]));
    }, []);

    const fetchProcedures = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const queryParts: string[] = ['limit=100'];

            if (typeFilter !== 'all') {
                queryParts.push(`type=${encodeURIComponent(typeFilter)}`);
            }

            if (statusFilter !== 'all') {
                queryParts.push(`status=${encodeURIComponent(statusFilter)}`);
            }

            if (doctorFilter !== null) {
                queryParts.push(`doctorId=${encodeURIComponent(String(doctorFilter))}`);
            }

            if (searchQuery.trim()) {
                queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
            }

            const url = `/medical/requests?${queryParts.join('&')}`;
            const res = await apiFetch<any>(url);

            const items: MedicalProcedure[] = Array.isArray(res)
                ? res
                : Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.requests)
                ? res.requests
                : [];

            setProcedures(items);
        } catch (error) {
            console.error('[useProcedures] Error loading requests:', error);
            setProcedures([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [typeFilter, statusFilter, doctorFilter, searchQuery]);

    useEffect(() => {
        if (!defaultScopeResolved) return;
        fetchProcedures();
    }, [fetchProcedures, defaultScopeResolved]);

    const updateProcedureStatus = async (
        id: number | string,
        newStatus: ProcedureStatus,
        notes?: { doctor_note?: string; secretary_note?: string }
    ) => {
        try {
            setActionLoading(true);
            await apiFetch(`/medical/requests/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                    ...notes,
                }),
            });

            // Update in local state
            setProcedures((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              status: newStatus,
                              completed_at: newStatus === 'completed' ? new Date().toISOString() : item.completed_at,
                              ...(notes?.doctor_note ? { doctor_note: notes.doctor_note } : {}),
                              ...(notes?.secretary_note ? { secretary_note: notes.secretary_note } : {}),
                          }
                        : item
                )
            );
            return true;
        } catch (error) {
            console.error('[useProcedures] Error updating status:', error);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        procedures,
        loading,
        refreshing,
        typeFilter,
        setTypeFilter,
        statusFilter,
        setStatusFilter,
        doctorFilter,
        setDoctorFilter,
        doctors,
        searchQuery,
        setSearchQuery,
        actionLoading,
        refresh: () => fetchProcedures(true),
        updateProcedureStatus,
    };
};
