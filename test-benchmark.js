// Mock the repositories and database pool to measure the js code + mocked async time
const financeService = require('./server/services/finance/financeService');

// Stub dependencies
const transactionRepository = require('./server/repositories/transactionRepository');
const appointmentRepository = require('./server/repositories/appointmentRepository');
const medicalRequestRepository = require('./server/repositories/medicalRequestRepository');
const { pool } = require('./server/db');

// Mock pool
pool.getConnection = async () => {
    return {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async () => { opCount++; await new Promise(r => setTimeout(r, 1)); return [{ method: 'cash' }] }
    };
};

let opCount = 0;
// Mock transactionRepository
transactionRepository.findPendingByInstitutionId = async (instId, conn) => {
    const debts = [];
    for (let i = 1; i <= 1000; i++) {
        debts.push({
            id: i,
            amount: 10,
            description: 'Debt ' + i,
            appointment_id: i, // Give each one an appointment
            request_id: null
        });
    }
    return debts;
};

transactionRepository.update = async (id, updates, conn) => {
    opCount++;
    await new Promise(r => setTimeout(r, 1)); // Simulate DB latency
};

transactionRepository.create = async (data, conn) => {
    opCount++;
    await new Promise(r => setTimeout(r, 1)); // Simulate DB latency
};

transactionRepository.getPaymentSummary = async (apptId, conn) => {
    opCount++;
    await new Promise(r => setTimeout(r, 1)); // Simulate DB latency
    return { totalPaid: 10, totalPending: 0, hasPaid: true, hasPending: false };
};

appointmentRepository.update = async (id, updates, conn) => {
    opCount++;
    await new Promise(r => setTimeout(r, 1)); // Simulate DB latency
};


async function run() {
    console.log("Measuring NEW payInstitutionDebt...");
    const start = Date.now();
    await financeService.payInstitutionDebt({
        institution_id: 1,
        amount: 10000, // exact 1000 x 10, all fully paid
        method: 'transfer',
        transaction_ids: []
    }, 1);
    const end = Date.now();
    console.log(`Execution time: ${end - start}ms`);
    console.log(`Simulated DB operations: ${opCount}`);
}

run().catch(console.error).finally(() => process.exit(0));
