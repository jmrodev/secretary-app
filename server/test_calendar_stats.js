const axios = require('axios');

async function testCalendarStats() {
    try {
        // Obtener token de autenticación
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin'
        });

        const token = loginResponse.data.token;

        // Obtener stats del calendario para enero 2026
        const statsResponse = await axios.get('http://localhost:5000/api/appointments/stats', {
            params: {
                year: 2026,
                month: 1,
                doctor_id: 1 // Ajusta según tu doctor
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('=== Calendar Stats Response ===');
        console.log(JSON.stringify(statsResponse.data, null, 2));

        // Verificar día 27 específicamente
        const day27 = statsResponse.data['2026-01-27'];
        if (day27) {
            console.log('\n=== Día 27 de Enero ===');
            console.log(`Libres dentro de horario: ${day27.freeIn}`);
            console.log(`Libres fuera de horario: ${day27.freeOut}`);
            console.log(`Ocupados dentro de horario: ${day27.bookedIn}`);
            console.log(`Ocupados fuera de horario: ${day27.bookedOut}`);
            console.log(`Total capacidad: ${day27.totalIn}`);
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testCalendarStats();
