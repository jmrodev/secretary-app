import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { usePermissions } from '@/hooks/usePermissions';

const DoctorContext = createContext();

export const useDoctors = () => {
    const context = useContext(DoctorContext);
    if (!context) {
        const message = '[DoctorContext] useDoctors must be used within a DoctorProvider. If this happened during HMR, do a full page reload.';
        if (import.meta.env.DEV) {
            console.error(message);
        }
        throw new Error(message);
    }
    return context;
};

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

    const doctors = doctorData?.doctors || [];

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
                setViewDoctorId(profile.id);
            }
        }
    }, [isDoctor, doctors, user, viewDoctorId, setViewDoctorId]);

    const currentDoctor = doctors.find(d => String(d.id) === String(viewDoctorId)) || null;

    const value = {
        doctors,
        doctorsLoading,
        viewDoctorId,
        setViewDoctorId,
        currentDoctor,
        doctorDisplayName: currentDoctor ? currentDoctor.full_name : null,
        isStaff
    };

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};
