const { pool } = require('./db');
const { PatientsQueryBuilder } = require('./utils/queryBuilders');

async function test() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB");

        const user = { role: 'admin', user_id: 1 }; // Simulated user
        const builder = new PatientsQueryBuilder(user);

        console.log("Applying Role Filter...");
        await builder.applyRoleFilter();

        console.log("Building Query...");
        builder.withFullDetails().sortByName();

        const { query, params } = builder.build();
        console.log("Query:", query);
        console.log("Params:", params);

        console.log("Executing Query...");
        const rows = await conn.query(query, params);
        console.log(`Found ${rows.length} rows`);

        if (rows.length > 0) {
            const patientIds = rows.map(r => r.id);
            console.log("Fetching phones for patients:", patientIds.slice(0, 5));
            const allPhones = await conn.query(
                "SELECT * FROM phone_numbers WHERE entity_type = 'patient' AND entity_id IN (?)",
                [patientIds]
            );
            console.log(`Found ${allPhones.length} phones`);
        }

        console.log("Test Success!");
    } catch (err) {
        console.error("Test Failed!");
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

test();
