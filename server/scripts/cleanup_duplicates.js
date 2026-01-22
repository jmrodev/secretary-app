const mysql = require('mysql2/promise');

async function repair() {
    const connection = await mysql.createConnection({
        host: 'db',
        user: 'root',
        password: 'cima1255',
        database: 'clinical_management'
    });

    try {
        console.log("Finding potential duplicates to link...");

        // Find pairs where one has ID and one doesn't at the same time/doctor
        const [duplicates] = await connection.execute(`
            SELECT a1.id as id_with_google, a2.id as id_without_google, a1.google_event_id, a1.doctor_id, a1.appointment_date
            FROM appointments a1
            JOIN appointments a2 ON a1.doctor_id = a2.doctor_id 
                AND a1.appointment_date = a2.appointment_date
                AND a1.id != a2.id
            WHERE a1.google_event_id IS NOT NULL 
                AND a2.google_event_id IS NULL
                AND a1.patient_id IS NULL
                AND a2.patient_id IS NOT NULL
        `);

        console.log(`Found ${duplicates.length} cleanup candidates.`);

        for (const row of duplicates) {
            console.log(`Linking ${row.google_event_id} to appointment ${row.id_without_google} and removing ghost ${row.id_with_google}`);

            // 1. Update the local one with the google ID
            await connection.execute("UPDATE appointments SET google_event_id = ? WHERE id = ?", [row.google_event_id, row.id_without_google]);

            // 2. Delete the ghost imported one
            await connection.execute("DELETE FROM appointments WHERE id = ?", [row.id_with_google]);
        }

        console.log("Repair finished successfully.");
    } catch (err) {
        console.error("Repair failed:", err);
    } finally {
        await connection.end();
    }
}

repair();
