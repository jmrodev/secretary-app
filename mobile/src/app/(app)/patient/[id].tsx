import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PatientDetailView } from '@/features/patients/PatientDetailView';

export default function PatientDetailRoute() {
    const { id, appointmentId } = useLocalSearchParams<{
        id: string;
        appointmentId?: string;
    }>();

    return (
        <PatientDetailView
            patientId={id}
            appointmentId={appointmentId || null}
        />
    );
}
