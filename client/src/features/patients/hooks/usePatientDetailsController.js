import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/axios';

const unpack = (res) => {
    if (!res || !res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.requests)) return res.data.requests;
    if (Array.isArray(res.data.prescriptions)) return res.data.prescriptions;
    if (Array.isArray(res.data.files)) return res.data.files;
    return [];
};

export const usePatientDetailsController = (patientId) => {
    const [chronicMeds, setChronicMeds] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [officialPrescriptions, setOfficialPrescriptions] = useState([]);
    const [patientFiles, setPatientFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const refetchMedications = useCallback(() => {
        if (!patientId) return;
        api.get(`/medical/patients/${patientId}/medications`)
            .then(res => setChronicMeds(unpack(res)))
            .catch(err => console.error("Error fetching chronic meds:", err));
    }, [patientId]);

    const refetchFiles = useCallback(() => {
        if (!patientId) return;
        setLoadingFiles(true);
        api.get(`/medical/files?patient_id=${patientId}`)
            .then(res => setPatientFiles(unpack(res)))
            .catch(err => console.error("Error fetching patient files:", err))
            .finally(() => setLoadingFiles(false));
    }, [patientId]);

    useEffect(() => {
        if (!patientId) return;

        // Deferred to a microtask: refetchFiles sets loadingFiles synchronously
        // and the rule forbids setState during the effect body.
        queueMicrotask(() => {
            refetchMedications();

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

            refetchFiles();
        });
    }, [patientId, refetchMedications, refetchFiles]);

    return { chronicMeds, recentRequests, officialPrescriptions, patientFiles, loadingFiles, refetchMedications, refetchFiles };
};
