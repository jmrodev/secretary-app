import api from '@/api/axios';

/**
 * ECC-Pattern: patientService (Optimized)
 * Unifies patient-related API calls with ECC envelope support.
 */
export const patientService = {
    /**
     * Search patients by term (name, dni, phone, etc.)
     */
    async search(query, doctorId = null) {
        if (!query || query.length < 2) return [];
        
        const params = { search: query, limit: 20 };
        if (doctorId) params.doctor_id = doctorId;
        
        try {
            const res = await api.get('/users/patients', { params });
            // ECC Pattern: Extract data from envelope
            const payload = res.data?.success !== undefined ? res.data.data : res.data;
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.patients)) return payload.patients;
            if (Array.isArray(res.data?.patients)) return res.data.patients;
            return [];
        } catch (err) {
            console.error("[ECC-Service] Error searching patients:", err);
            throw err;
        }
    },

    /**
     * Get patient details by ID
     */
    async getById(id) {
        try {
            const res = await api.get(`/users/patients/${id}`);
            return res.data?.success !== undefined ? res.data.data : res.data;
        } catch (err) {
            console.error("[ECC-Service] Error getting patient by ID:", err);
            throw err;
        }
    },

    /**
     * Get patients with recent activity
     */
    async getRecent() {
        try {
            const res = await api.get('/users/patients/recent');
            const responseData = res.data?.success !== undefined ? res.data.data : res.data;
            return Array.isArray(responseData) ? responseData : (responseData.patients || []);
        } catch (err) {
            console.error("[ECC-Service] Error getting recent patients:", err);
            throw err;
        }
    }
};
