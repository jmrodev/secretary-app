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
    const [viewDoctorIdInternal, setViewDoctorIdInternal] = useState(
        localStorage.getItem('global_selected_doctor_id') || ''
    );

    // Doctors List (Cached globally)
    const { data: doctorData, loading: doctorsLoading, fetched: doctorsFetched } = useFetch('/users/doctors', {
        initialData: { doctors: [], totalCount: 0 },
        immediate: !!user // Fetch only if logged in
    });

    const doctors = useMemo(() => {
        if (Array.isArray(doctorData)) return doctorData;
        return doctorData?.doctors || [];
    }, [doctorData]);

    const setViewDoctorId = useCallback((id) => {
        const stringId = id ? String(id) : '';
        setViewDoctorIdInternal(prev => {
            if (prev === stringId) return prev;
            localStorage.setItem('global_selected_doctor_id', stringId);
            return stringId;
        });
    }, []);

    // Derive viewDoctorId to eliminate render cascades from useEffect
    const viewDoctorId = useMemo(() => {
        if (viewDoctorIdInternal) return viewDoctorIdInternal;
        if (isDoctor && doctors.length > 0) {
            const profile = doctors.find(d => d.user_id === (user?.user_id || user?.id));
            if (profile) return String(profile.id);
        }
        return '';
    }, [viewDoctorIdInternal, isDoctor, doctors, user]);

    const currentDoctor = useMemo(() => 
        doctors.find(d => String(d.id) === String(viewDoctorId)) || null
    , [doctors, viewDoctorId]);

    const value = useMemo(() => ({
        doctors,
        doctorsLoading,
        doctorsFetched,
        viewDoctorId,
        setViewDoctorId,
        currentDoctor,
        doctorDisplayName: currentDoctor ? currentDoctor.full_name : null,
        isStaff
    }), [doctors, doctorsLoading, doctorsFetched, viewDoctorId, setViewDoctorId, currentDoctor, isStaff]);


    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};
