const { pool } = require('./server/db');
const financeService = require('./server/services/finance/financeService');
const transactionRepository = require('./server/repositories/transactionRepository');

async function runBenchmark() {
    const conn = await pool.getConnection();
    try {
        console.log("Setting up benchmark data...");
        // find a patient
        const patients = await conn.query("SELECT id, user_id FROM patients LIMIT 1");
        const patient = patients[0];

        const doctors = await conn.query("SELECT id FROM doctors LIMIT 1");
        const doctor = doctors[0];

        const numDebts = 1000;
        console.log(`Creating ${numDebts} debts for patient ${patient.id}...`);

        const numRuns = 5;
        let totalMs = 0;

        for (let run = 1; run <= numRuns; run++) {
            await conn.query("DELETE FROM transactions WHERE description LIKE 'BENCHMARK DEBT%' OR description LIKE 'BENCHMARK DEBT% - Paid'");

            for (let i = 0; i < numDebts; i++) {
                await transactionRepository.create({
                    type: 'income_patient',
                    amount: 10,
                    description: `BENCHMARK DEBT ${i}`,
                    related_user_id: patient.user_id,
                    doctor_id: doctor.id,
                    status: 'pending',
                    method: 'on_account',
                    appointment_id: null,
                    transaction_date: '2023-10-01'
                }, conn);
            }

            const start = process.hrtime.bigint();

            await financeService.payDebt({
                patient_id: patient.id,
                amount: numDebts * 10,
                method: 'transfer',
                doctor_id: doctor.id
            }, 1);

            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1e6;
            console.log(`Run ${run}: ${durationMs.toFixed(2)} ms`);
            totalMs += durationMs;
        }

        console.log(`\nAverage payDebt execution time: ${(totalMs / numRuns).toFixed(2)} ms`);

    } catch (e) {
        console.error(e);
    } finally {
        await conn.query("DELETE FROM transactions WHERE description LIKE 'BENCHMARK DEBT%' OR description LIKE 'BENCHMARK DEBT% - Paid'");
        conn.release();
        process.exit(0);
    }
}

runBenchmark();
