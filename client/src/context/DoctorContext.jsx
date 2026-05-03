import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { usePermissions } from '@/hooks/usePermissions';
import { DoctorContext } from './DoctorContextDefinition';

/**
 * DoctorProvider
 * Manages the global state of doctors and the currently selected doctor filter.
 */
export const DoctorProvider = ({ children }) => {
    const { user, isStaff, isDoctor } = usePermissions();
    
    // Global filter state
    const [viewDoctorId, setViewDoctorIdInternal] = useState(
        localStorage.getItem('global_selected_doctor_id') || ''
    );

    // Doctors List (Cached globally)
    const { data: doctorData, loading: doctorsLoading } = useFetch('/users/doctors', {
        initialData: { doctors: [], totalCount: 0 },
        immediate: !!user // Fetch only if logged in
    });

    const doctors = useMemo(() => doctorData?.doctors || [], [doctorData]);

    const setViewDoctorId = useCallback((id) => {
        const stringId = id ? String(id) : '';
        setViewDoctorIdInternal(stringId);
        localStorage.setItem('global_selected_doctor_id', stringId);
    }, []);

    // Initial logic: if user is a doctor, default to their own ID
    useEffect(() => {
        if (isDoctor && doctors.length > 0 && !viewDoctorId) {
            const profile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (profile) {
                // Use a timeout to avoid synchronous setState during effect execution
                const timeoutId = setTimeout(() => {
                    setViewDoctorId(profile.id);
                }, 0);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [isDoctor, doctors, user, viewDoctorId, setViewDoctorId]);

    const currentDoctor = useMemo(() => 
        doctors.find(d => String(d.id) === String(viewDoctorId)) || null
    , [doctors, viewDoctorId]);

    const value = useMemo(() => ({
        doctors,
        doctorsLoading,
        viewDoctorId,
        setViewDoctorId,
        currentDoctor,
        doctorDisplayName: currentDoctor ? currentDoctor.full_name : null,
        isStaff
    }), [doctors, doctorsLoading, viewDoctorId, setViewDoctorId, currentDoctor, isStaff]);

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};
