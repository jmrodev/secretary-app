import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    paramsSerializer: {
        indexes: null // This removes the brackets [] from array parameters
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const doctorId = localStorage.getItem('global_selected_doctor_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (doctorId) {
        config.headers['x-doctor-id'] = doctorId;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

