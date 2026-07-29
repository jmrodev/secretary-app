import { useMemo } from 'react';
import { formatDate, compareDates, getNow } from '@/utils/core/dateUtils';

export const useMedicalDocumentsDerivedData = ({
    prescriptions,
    requests,
    licenses,
    t
}) => {
    const combinedPrescriptions = useMemo(() => [
        ...prescriptions.map(p => ({ ...p, _origin: 'prescription' })),
        ...requests.reduce((acc, r) => {
            if (r.type === 'prescription' && r.status === 'completed') {
                acc.push({
                    ...r,
                    _origin: 'request',
                    medications: r.request_note,
                    instructions: r.doctor_note
                });
            }
            return acc;
        }, [])
    ].toSorted((a, b) => compareDates(a.created_at, b.created_at, true)), [prescriptions, requests]);

    const combinedLicenses = useMemo(() => [
        ...licenses.map(l => ({ ...l, _origin: 'license' })),
        ...requests.reduce((acc, r) => {
            if (r.type === 'license' && r.status === 'completed') {
                acc.push({
                    ...r,
                    _origin: 'request',
                    start_date: r.created_at,
                    days_duration: '-',
                    diagnosis: r.request_note
                });
            }
            return acc;
        }, [])
    ].toSorted((a, b) => compareDates(a.created_at, b.created_at, true)), [licenses, requests]);

    const combinedCertificates = useMemo(() => requests.reduce((acc, r) => {
        if (r.type === 'certificate' && r.status === 'completed') {
            acc.push({
                ...r,
                _origin: 'request',
                description: r.request_note
            });
        }
        return acc;
    }, []).toSorted((a, b) => compareDates(a.created_at, b.created_at, true)), [requests]);

    const printDate = useMemo(() => {
        if (t) { /* force reactivity on translation change */ }
        return formatDate(getNow(), { time: true });
    }, [t]);

    return {
        combinedPrescriptions,
        combinedLicenses,
        combinedCertificates,
        printDate
    };
};
