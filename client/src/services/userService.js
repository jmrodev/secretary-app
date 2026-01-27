import api from '../api/axios';

export const userService = {
    getPatients: async () => {
        const response = await api.get('/users/patients');
        return response.data;
    },

    getDoctors: async () => {
        const response = await api.get('/users/doctors');
        return response.data;
    }
};
