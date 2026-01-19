const { pool } = require('./db');

async function findAppointment() {
    try {
        const patientName = 'mariana san martin';
        const appointmentDate = '2026-03-13 12:00:00';

        console.log(`Searching for patient: ${patientName}`);
        const patients = await pool.query(
            "SELECT id, full_name FROM patients WHERE full_name LIKE ?",
            [`%${patientName}%`]
        );

        if (patients.length === 0) {
            console.log('No patient found with that name.');
            return;
        }

        console.log('Found patients:', patients);

        for (const patient of patients) {
            console.log(`Searching for appointments for patient ID: ${patient.id} on date: ${appointmentDate}`);
            const appointments = await pool.query(
                "SELECT id, appointment_date, status FROM appointments WHERE patient_id = ? AND appointment_date = ?",
                [patient.id, appointmentDate]
            );

            if (appointments.length > 0) {
                console.log('Found appointments:', appointments);
            } else {
                console.log(`No appointment found for patient ID: ${patient.id} on ${appointmentDate}`);

                // Let's try searching without the exact time or within that day
                const appointmentsDay = await pool.query(
                    "SELECT id, appointment_date, status FROM appointments WHERE patient_id = ? AND DATE(appointment_date) = '2026-03-13'",
                    [patient.id]
                );
                if (appointmentsDay.length > 0) {
                    console.log('Found appointments on that day:', appointmentsDay);
                }
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findAppointment();
