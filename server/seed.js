const bcrypt = require('bcrypt');
const { pool } = require('./db');
const dotenv = require('dotenv');

dotenv.config();

async function seed() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database...");
        console.log("Starting extended seeding...");

        const password = await bcrypt.hash('password123', 10);
        const today = new Date();

        // Helpers
        const addDays = (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        };

        // 0. Clean (Optional if we run after SQL recreation, but safe to keep)
        // SQL script handles drop/create, so tables are empty.

        // --- USERS & PROFILES ---

        // 1. Admin
        const resAdmin = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['admin', password, 'admin']);
        console.log("Created Admin");

        // 2. Secretaries (2)
        const secretaries = [
            { user: 'sec_joan', name: 'Joan Holloway', phone: '111-2222', dni: '20111222' },
            { user: 'sec_pam', name: 'Pam Beesly', phone: '333-4444', dni: '20333444' }
        ];

        for (const s of secretaries) {
            const res = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [s.user, password, 'secretary']);
            await conn.query("INSERT INTO secretaries (user_id, full_name, phone, dni) VALUES (?, ?, ?, ?)", [res.insertId, s.name, s.phone, s.dni]);
        }
        console.log(`Created ${secretaries.length} Secretaries`);

        // 3. Doctors (4)
        const doctorsData = [
            { user: 'doc_house', name: 'Dr. Gregory House', specialty: 'Diagnostician', price: 5000, rental: 'monthly', rent_cost: 0 },
            { user: 'doc_wilson', name: 'Dr. James Wilson', specialty: 'Oncology', price: 4000, rental: 'monthly', rent_cost: 0 },
            { user: 'doc_cuddy', name: 'Dr. Lisa Cuddy', specialty: 'Endocrinology', price: 4500, rental: 'hourly', rent_cost: 50 },
            { user: 'doc_foreman', name: 'Dr. Eric Foreman', specialty: 'Neurology', price: 4200, rental: 'weekly', rent_cost: 200 }
        ];

        const doctorIds = []; // store doctor TABLE IDs (not user_ids)

        for (const d of doctorsData) {
            const res = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [d.user, password, 'doctor']);
            const userId = Number(res.insertId);
            const resDoc = await conn.query(
                "INSERT INTO doctors (user_id, full_name, specialty, consultation_price, rental_type, rental_cost, prescription_price, medical_license_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [userId, d.name, d.specialty, d.price, d.rental, d.rent_cost || 0, 2000, 3000]
            );
            doctorIds.push(Number(resDoc.insertId));
        }
        console.log(`Created ${doctorsData.length} Doctors`);

        // 4. Patients (4)
        const patientsData = [
            { user: 'pat_mario', name: 'Mario Rossi', dob: '1980-05-15', insurance: 'OSDE 210', dni: '30123456' },
            { user: 'pat_luigi', name: 'Luigi Verdi', dob: '1983-08-20', insurance: 'Swiss Medical', dni: '30789012' },
            { user: 'pat_peach', name: 'Peach Toadstool', dob: '1990-02-14', insurance: 'Galeno', dni: '35111222' },
            { user: 'pat_bowser', name: 'Bowser Koopa', dob: '1975-11-30', insurance: 'Particular', dni: '25666777' }
        ];

        const patientIds = []; // store patient TABLE IDs
        const patientUserIds = []; // store User IDs for transactions

        for (const p of patientsData) {
            const res = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [p.user, password, 'patient']);
            const userId = Number(res.insertId);
            patientUserIds.push(userId);
            const resPat = await conn.query(
                "INSERT INTO patients (user_id, full_name, dob, insurance, dni, medical_history) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, p.name, p.dob, p.insurance, p.dni, 'No known allergies. Regular checkups.']
            );
            patientIds.push(Number(resPat.insertId));
        }
        console.log(`Created ${patientsData.length} Patients`);

        // --- INTERACTIONS ---

        // Appointments & Records
        // Distribute appointments amongst doctors and patients
        // Dates: Yesterday, Today, Tomorrow, Next Week

        const appointmentConfigs = [
            // Yesterday (Completed, Paid)
            { pIdx: 0, dIdx: 0, date: addDays(today, -1), status: 'completed', pay: 'paid', reason: 'Leg pain' },
            // Today (Confirmed, Pending Payment)
            { pIdx: 1, dIdx: 1, date: today, status: 'confirmed', pay: 'pending', reason: 'Checkup' },
            // Today (Completed, Debt)
            { pIdx: 2, dIdx: 2, date: today, status: 'completed', pay: 'debt', reason: 'Hormonal imbalance' },
            // Tomorrow (Pending)
            { pIdx: 3, dIdx: 3, date: addDays(today, 1), status: 'pending', pay: 'pending', reason: 'Headache' },
            // Next Week (Confirmed)
            { pIdx: 0, dIdx: 1, date: addDays(today, 7), status: 'confirmed', pay: 'pending', reason: 'Follow up' }
        ];

        for (const cfg of appointmentConfigs) {
            const pId = patientIds[cfg.pIdx];
            const dId = doctorIds[cfg.dIdx];
            const pUserId = patientUserIds[cfg.pIdx];
            const docData = doctorsData[cfg.dIdx];

            // Create Appointment
            const resApp = await conn.query(
                "INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status, payment_status, cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [pId, dId, cfg.date, cfg.reason, cfg.status, cfg.pay, docData.price]
            );
            const appId = Number(resApp.insertId);

            // Create Transaction/Debt based on payment status
            if (cfg.pay === 'paid') {
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    ['income_patient', docData.price, `Consultation Dr. ${docData.name}`, pUserId, dId, 'cash', 'paid', cfg.date]
                );
            } else if (cfg.pay === 'debt') {
                // Initial transaction as Pending/Credit (Debt)
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    ['income_patient', docData.price, `DEBT: Consultation Dr. ${docData.name}`, pUserId, dId, 'credit', 'pending', cfg.date]
                );
            }

            // Add Medical Records for 'completed' appointments
            if (cfg.status === 'completed') {
                // 50% chance of prescription
                if (Math.random() > 0.5) {
                    await conn.query(
                        "INSERT INTO prescriptions (appointment_id, medications, instructions, payment_status) VALUES (?, ?, ?, ?)",
                        [appId, 'Ibuprofen 600mg', 'Take one every 8 hours', 'pending']
                    );
                    // Add Transaction for prescription cost? (Simplification: skip for now or add debt)
                }

                // 20% chance of license
                if (Math.random() > 0.7) {
                    await conn.query(
                        "INSERT INTO medical_licenses (appointment_id, start_date, days_duration, diagnosis, payment_status) VALUES (?, ?, ?, ?, ?)",
                        [appId, cfg.date, 3, 'Viral infection', 'paid']
                    );
                }
            }
        }
        console.log("Created Appointments and Finance Records");

        // Extra Transactions (Withdrawals, etc.)
        // Dr. House withdraws cash
        const houseId = doctorIds[0];
        await conn.query(
            "INSERT INTO transactions (type, amount, description, doctor_id, status, is_withdrawal) VALUES (?, ?, ?, ?, ?, ?)",
            ['withdrawal', 2000, 'Weekly withdrawal', houseId, 'paid', true]
        );

        console.log("Seeding complete!");

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

seed();
