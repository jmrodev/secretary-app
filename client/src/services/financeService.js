import api from '../api/axios';

export const financeService = {
    getPricing: async (doctorId, patientId, serviceType) => {
        const response = await api.get(`/finances/pricing`, {
            params: { doctor_id: doctorId, patient_id: patientId, service_type: serviceType }
        });
        return response.data;
    },

    createTransaction: async (data) => {
        const response = await api.post('/finances/transactions', data);
        return response.data;
    }
};
