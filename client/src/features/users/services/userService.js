import { api } from '@/api/axios';

/**
 * ECC-Pattern: userService (Optimized)
 * Handles user-related API calls with ECC envelope support.
 */
export const userService = {
    getPatients: async (params = {}) => {
        const response = await api.get('/users/patients', { params });
        // Handle ECC envelope
        const data = response.data?.success !== undefined ? response.data.data : response.data;
        // Support both flat array and object with patients key
        if (Array.isArray(data)) return { patients: data, totalCount: response.data?.meta?.totalCount || data.length };
        return data;
    },

    getDoctors: async () => {
        const response = await api.get('/users/doctors');
        // Handle ECC envelope
        const data = response.data?.success !== undefined ? response.data.data : response.data;
        // Always return as an array for consistency
        return Array.isArray(data) ? data : (data.doctors || []);
    }
};
