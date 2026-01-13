const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');

// BigInt JSON serialization fix
BigInt.prototype.toJSON = function () { return Number(this); };

const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/consultorios', require('./routes/consultorioRoutes'));
app.use('/api/medical', require('./routes/medicalRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/finances', require('./routes/financeRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/google', require('./routes/googleRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/insurances', require('./routes/insuranceRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/uploads', express.static('uploads'));

app.get('/api/debug/dump-appointments', async (req, res) => {
    try {
        const { pool } = require('./db');
        const conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT a.id, a.doctor_id, d.full_name as doctor_name, a.patient_id, a.appointment_date, a.status 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            ORDER BY a.doctor_id
        `);
        conn.release();
        res.json({ count: rows.length, rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MariaDB');

        // Debug: Identify DB
        const dbInfo = await conn.query("SELECT DATABASE() as db, @@hostname as host");
        console.log("!!! CONNECTED TO DB:", dbInfo[0]?.db);

        const appts = await conn.query("SELECT * FROM appointments LIMIT 1");
        console.log("!!! SAMPLE APPOINTMENT:", appts.length > 0 ? "Found Data" : "NO DATA (Empty DB)");


        conn.release();

        // Start Google Sync Worker
        const { startSyncWorker } = require('./services/googleSyncService');
        startSyncWorker();

    } catch (err) {
        console.error('Failed to connect to MariaDB:', err);
    }
});
