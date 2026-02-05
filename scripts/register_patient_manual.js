
const axios = require('axios');

async function registerPatient() {
    const API_URL = 'http://localhost:5000/api';

    try {
        console.log('Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');

        // The user's requested data
        const patientData = {
            first_name: 'carlos', // Note: lowercase as the secretary would put it
            last_name: 'garcia',
            dni: '12345678',
            address: 'sarmiento 123',
            username: 'carlosgarcia',
            password: 'password123',
            role: 'patient',
            fullName: 'Carlos Garcia' // The backend might use this
        };

        // Apply our capitalization logic manually for the demonstration if we were the client
        const capitalizeWords = (str) => {
            if (!str || typeof str !== 'string') return str;
            return str.replace(/(^|\s)\S/g, l => l.toUpperCase());
        };

        const payload = {
            ...patientData,
            first_name: capitalizeWords(patientData.first_name),
            last_name: capitalizeWords(patientData.last_name),
            address: capitalizeWords(patientData.address),
            fullName: `${capitalizeWords(patientData.first_name)} ${capitalizeWords(patientData.last_name)}`
        };

        console.log('Registering patient with payload:', payload);

        const registerRes = await axios.post(`${API_URL}/auth/register`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Patient registered successfully:', registerRes.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

registerPatient();
