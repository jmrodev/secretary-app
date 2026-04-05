import api from '@/api/axios';

/**
 * Institutions Service
 * Handles all network requests related to the Institutions domain.
 */
class InstitutionService {
    async getAllInstitutions() {
        const response = await api.get('/institutions');
        return response.data;
    }

    async createInstitution(data) {
        const response = await api.post('/institutions', data);
        return response.data;
    }

    async updateInstitution(id, data) {
        const response = await api.put(`/institutions/${id}`, data);
        return response.data;
    }

    async deleteInstitution(id) {
        const response = await api.delete(`/institutions/${id}`);
        return response.data;
    }
}

export const institutionService = new InstitutionService();
