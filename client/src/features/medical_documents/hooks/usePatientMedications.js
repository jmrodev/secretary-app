import { useEffect } from 'react';

export const usePatientMedications = (patientId, setPatientMeds, setHistoryMeds) => {
    useEffect(() => {
        if (!patientId) return;

        import('@/api/axios').then(module => {
            const api = module.default;

            // Fetch habitual meds
            api.get(`/medical/patients/${patientId}/medications`)
                .then(res => setPatientMeds(res.data))
                .catch(err => console.error("Error fetching meds", err));

            // Fetch recent prescriptions to build history list
            api.post('/medical/requests', { patientId, type: 'prescription' })
                .then(res => {
                    const historyItems = [];
                    const seenNames = new Set();

                    res.data.forEach(req => {
                        // 1. Try structured data first
                        if (req.raw_medication_data) {
                            try {
                                const rawItems = typeof req.raw_medication_data === 'string'
                                    ? JSON.parse(req.raw_medication_data)
                                    : req.raw_medication_data;

                                if (Array.isArray(rawItems)) {
                                    rawItems.forEach(it => {
                                        const name = it.medication_name || it.name;
                                        if (name && !seenNames.has(name.toLowerCase())) {
                                            historyItems.push(it);
                                            seenNames.add(name.toLowerCase());
                                        }
                                    });
                                }
                            } catch (e) { console.warn("Error parsing raw_medication_data", e); }
                        }

                        // 2. Fallback to parsing text field if we need more
                        if (req.medications && seenNames.size < 10) {
                            req.medications.split('\n').forEach(line => {
                                const name = line.trim().split(' (')[0].split(' x')[0].split(' cada')[0];
                                if (name && !seenNames.has(name.toLowerCase())) {
                                    historyItems.push({ medication_name: name });
                                    seenNames.add(name.toLowerCase());
                                }
                            });
                        }
                    });
                    setHistoryMeds(historyItems.slice(0, 15));
                });
        });
    }, [patientId, setPatientMeds, setHistoryMeds]);
};
