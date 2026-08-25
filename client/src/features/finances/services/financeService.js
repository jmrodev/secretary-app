import { api } from '@/api/axios';

export const financeService = {
    getPricing: async (doctorId, patientId, serviceType) => {
        const response = await api.post(`/finances/pricing`, {
            doctor_id: doctorId,
            patientId: patientId,
            service_type: serviceType
        });
        return response.data?.data || response.data;
    },

    createTransaction: async (data) => {
        const response = await api.post('/finances/transactions', data);
        return response.data;
    }
};
