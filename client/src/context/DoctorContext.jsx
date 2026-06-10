import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { usePermissions } from '@/hooks/usePermissions';
import { DoctorContext } from './DoctorContextDefinition';

/**
 * ECC-Pattern: Optimized DoctorProvider
 */
export const DoctorProvider = ({ children }) => {
    const { user, isStaff, isDoctor } = usePermissions();
    
    // Global filter state
    const [viewDoctorIdInternal, setViewDoctorIdInternal] = useState(
        localStorage.getItem('global_selected_doctor_id') || ''
    );

    // Doctors List (Cached globally) - ECC Envelope support
    const { data: response, loading: doctorsLoading, fetched: doctorsFetched } = useFetch('/users/doctors', {
        initialData: { success: true, data: [] },
        immediate: !!user
    });

    const doctors = useMemo(() => {
        // Handle both raw array (legacy) and ECC envelope
        const rawData = response?.data || response;
        if (Array.isArray(rawData)) return rawData;
        return rawData?.doctors || [];
    }, [response]);

    const setViewDoctorId = useCallback((id) => {
        const stringId = id ? String(id) : '';
        setViewDoctorIdInternal(prev => {
            if (prev === stringId) return prev;
            localStorage.setItem('global_selected_doctor_id', stringId);
            return stringId;
        });
    }, []);

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
