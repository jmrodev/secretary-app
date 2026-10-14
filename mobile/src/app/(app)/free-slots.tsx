import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FreeSlotsView } from '@/features/free-slots/FreeSlotsView';

export default function FreeSlotsRoute() {
    const params = useLocalSearchParams<{ doctorId?: string }>();
    const initialDoctorId = params.doctorId ? Number(params.doctorId) : undefined;

    return <FreeSlotsView initialDoctorId={initialDoctorId} />;
}
