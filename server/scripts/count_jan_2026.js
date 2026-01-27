const { pool } = require('../db');

async function countJanuary2026() {
    let conn;
    try {
        conn = await pool.getConnection();
        const start = '2026-01-01 00:00:00';
        const end = '2026-02-01 00:00:00';

        console.log('--- Financial Projection Jan 2026 (Assumed Cost: $50,000) ---');

        // Get breakdown by status for the valid appointments (with patient)
        const query = `
            SELECT status, COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date >= ? 
            AND appointment_date < ? 
            AND patient_id IS NOT NULL 
            GROUP BY status
        `;

        const rows = await conn.query(query, [start, end]);

        let totalCount = 0;
        let potentialRevenueCount = 0;
        const assumedCost = 50000;

        console.log('\nBreakdown by Status (Valid Appointments):');
        for (const row of rows) {
            const count = parseInt(row.count); // ensure number
            totalCount += count;
            console.log(`- ${row.status}: ${count}`);

            // Assuming we charge for pending, confirmed, completed.
            // Excluding cancelled. Suspended/absent might depend on policy, but usually not paid if not attended or re-booked.
            // Let's count 'likely billable' as pending, confirmed, completed.
            if (['pending', 'confirmed', 'completed'].includes(row.status)) {
                potentialRevenueCount += count;
            }
        }

        console.log('-------------------------------------------');
        console.log(`Total Valid Appointments: ${totalCount}`);
        console.log(`Hypothetical Revenue (All ${totalCount} * $50,000): $${(totalCount * assumedCost).toLocaleString('es-AR')}`);

        if (potentialRevenueCount !== totalCount) {
            console.log(`Likely Billable (Pending/Confirmed/Completed: ${potentialRevenueCount} * $50,000): $${(potentialRevenueCount * assumedCost).toLocaleString('es-AR')}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

countJanuary2026();
