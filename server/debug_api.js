const { pool } = require('./db');
const { PatientsQueryBuilder } = require('./utils/queryBuilders');

async function debug() {
    let conn;
    try {
        conn = await pool.getConnection();
        const user = { role: 'admin', user_id: 1 }; // Simulated admin
        const builder = new PatientsQueryBuilder(user);

        await builder.applyRoleFilter();

        builder
            .withFullDetails()
            .applySearch('')
            .sortByName();

        const { query, params } = builder.build();
        console.log("Executing query...");
        const rows = await conn.query(query, params);
        console.log(`Found ${rows.length} rows`);

        if (rows.length > 0) {
            const patientIds = rows.map(r => r.id);
            console.log("Batch fetching phones...");
            const allPhones = await conn.query(
                "SELECT * FROM phone_numbers WHERE entity_type = 'patient' AND entity_id IN (?)",
                [patientIds]
            );

            const phoneMap = allPhones.reduce((acc, phone) => {
                if (!acc[phone.entity_id]) acc[phone.entity_id] = [];
                acc[phone.entity_id].push(phone);
                return acc;
            }, {});

            rows.forEach(r => {
                r.phoneNumbers = phoneMap[r.id] || [];
            });
        }

        console.log("Serializing...");
        const serialized = rows.map(r => ({
            ...r,
            total_debt: Number(r.total_debt),
            total_appointments: Number(r.total_appointments),
            missed_appointments: Number(r.missed_appointments)
        }));

        console.log("First row:", JSON.stringify(serialized[0], null, 2));
        console.log("Success!");
    } catch (err) {
        console.error("ERROR DETECTED:");
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

debug();
