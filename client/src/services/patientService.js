import api from '@/api/axios';

/**
 * patientService
 * Unifies patient-related API calls.
 */
export const patientService = {
    /**
     * Search patients by term (name, dni, phone, etc.)
     */
    async search(query, doctorId = null) {
        if (!query || query.length < 2) return [];
        
        const params = { search: query };
        if (doctorId) params.doctor_id = doctorId;
        
        try {
            const res = await api.get('/users/patients', { params });
            // Backend returns { patients, totalCount } or [patients]
            return Array.isArray(res.data) ? res.data : (res.data.patients || []);
        } catch (err) {
            console.error("Error searching patients", err);
            throw err;
        }
    },

    /**
     * Get patient details by ID
     */
    async getById(id) {
        const res = await api.get(`/users/patients/${id}`);
        return res.data;
    },
    /**
     * Get patients with recent activity (smart suggestions)
     */
    async getRecent() {
        const res = await api.get('/users/patients/recent');
        return res.data.patients || [];
    }
};
