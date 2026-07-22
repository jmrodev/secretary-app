import { useState, useEffect } from 'react';
import api from '@/api/axios';

export const usePatientDetailsController = (patientId) => {
    const [chronicMeds, setChronicMeds] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);

    useEffect(() => {
        if (!patientId) return;
        
        api.get(`/medical/patients/${patientId}/medications`)
            .then(res => setChronicMeds(res.data))
            .catch(err => console.error("Error fetching chronic meds:", err));

        api.get(`/medical/requests/patient/${patientId}`)
            .then(res => {
                const prescriptions = res.data.requests.filter(r => r.type === 'prescription');
                setRecentRequests(prescriptions);
            })
            .catch(err => console.error("Error fetching requests:", err));
    }, [patientId]);

    return { chronicMeds, recentRequests };
};
