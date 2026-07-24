import { useState, useEffect } from 'react';
import api from '@/api/axios';

const unpack = (res) => {
    if (!res || !res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.requests)) return res.data.requests;
    if (Array.isArray(res.data.prescriptions)) return res.data.prescriptions;
    return [];
};

export const usePatientDetailsController = (patientId) => {
    const [chronicMeds, setChronicMeds] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [officialPrescriptions, setOfficialPrescriptions] = useState([]);

    useEffect(() => {
        if (!patientId) return;
        
        api.get(`/medical/patients/${patientId}/medications`)
            .then(res => setChronicMeds(unpack(res)))
            .catch(err => console.error("Error fetching chronic meds:", err));

        api.get(`/medical/requests?patientId=${patientId}`)
            .then(res => {
                const list = unpack(res);
                const prescriptions = list.filter(r => r.type === 'prescription');
                setRecentRequests(prescriptions);
            })
            .catch(err => console.error("Error fetching requests:", err));

        api.get(`/medical/prescriptions?patientId=${patientId}`)
            .then(res => setOfficialPrescriptions(unpack(res)))
            .catch(err => console.error("Error fetching official prescriptions:", err));
    }, [patientId]);

    return { chronicMeds, recentRequests, officialPrescriptions };
};
