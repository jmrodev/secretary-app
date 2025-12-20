const { getPricing } = require('./controllers/financeController');
const { pool } = require('./db');

// Mock req, res
const mockRes = () => {
    return {
        json: (data) => console.log('RESPONSE:', data),
        status: (code) => ({ send: (msg) => console.log('ERROR:', code, msg) }),
        send: (msg) => console.log('SEND:', msg)
    };
};

(async () => {
    try {
        console.log("--- Testing Consultation (Expect ~5000) ---");
        const req1 = { query: { doctor_id: 1, patient_id: 1, service_type: 'consultation' } };
        await getPricing(req1, mockRes());

        console.log("\n--- Testing Prescription (Expect ~2000) ---");
        const req2 = { query: { doctor_id: 1, patient_id: 1, service_type: 'prescription' } };
        await getPricing(req2, mockRes());

        console.log("\n--- Testing Medical License (Expect ~3000) ---");
        const req3 = { query: { doctor_id: 1, patient_id: 1, service_type: 'medical_license' } };
        await getPricing(req3, mockRes());

        console.log("\n--- Testing Virtual Consultation (Expect ~4000) ---");
        const req4 = { query: { doctor_id: 1, patient_id: 1, service_type: 'virtual_consultation' } };
        await getPricing(req4, mockRes());

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
