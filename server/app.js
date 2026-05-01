const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');
const systemSettingsRepository = require('./repositories/systemSettingsRepository');
const appointmentRepository = require('./repositories/appointmentRepository');

// BigInt JSON serialization fix
BigInt.prototype.toJSON = function () { return Number(this); };

const authRoutes = require('./routes/authRoutes');
const institutionRoutes = require('./routes/institutionRoutes');

const morgan = require('morgan');
dotenv.config();

// Register Event Listeners
require('./listeners/appointmentListeners');

const { initScheduler } = require('./utils/scheduler');

const app = express();

// Professional HTTP Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Initialize Scheduler
initScheduler();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint for Monitoring/Docker
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Add bypass header for Cloudflare Tunnel and Auto-detect Staff IP
app.use(async (req, res, next) => {
    res.setHeader('Bypass-Tunnel-Reminder', 'true');

    // Self-learning: Detect if staff is accessing via a LAN IP and update staff_base_url
    try {
        const host = req.get('host'); // e.g. "192.168.1.50:5000"
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('.trycloudflare.com')) {
            const ipPart = host.split(':')[0];
            // Check if it's a private IPv4 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ipPart);

            if (isPrivate) {
                const staffUrl = `http://${host}`;

                // Only update if different to avoid constant DB writes
                if (global.lastDetectedStaffIp !== staffUrl) {
                    global.lastDetectedStaffIp = staffUrl;
                    await systemSettingsRepository.upsert('staff_base_url', staffUrl);
                    console.log(`🤖 Auto-detected Staff LAN IP: ${staffUrl}`);
                }
            }
        }
    } catch (e) {
        // Silently fail to not block the request
    }

    next();
});

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
app.use('/api/temp-access', require('./routes/tempAccessRoutes'));
app.use('/api/institutions', institutionRoutes);
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/uploads', express.static('uploads'));

app.get('/api/debug/dump-appointments', async (req, res) => {
    try {
        const rows = await appointmentRepository.findAllDetailed();
        res.json({ count: rows.length, rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MariaDB');

        // Debug: Identify DB
        const dbInfo = await conn.query("SELECT DATABASE() as db, @@hostname as host");
        console.log("!!! CONNECTED TO DB:", dbInfo[0]?.db);

        conn.release();


        // Start Google Sync Worker
        const { startSyncWorker } = require('./services/googleSyncService');
        startSyncWorker();

        // Start WhatsApp Bridge (Go)
        // The bridge is now managed by docker-compose
        // const whatsappBridgeService = require('./services/whatsappBridgeService');
        // whatsappBridgeService.init();



    } catch (err) {
        console.error('Failed to connect to MariaDB:', err);
    }
});

// Graceful Shutdown Logic
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log('👋 HTTP server closed.');
        pool.end().then(() => {
            console.log('💾 Database connections closed.');
            process.exit(0);
        });
    });

    // Force shutdown after 10s
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forceful shutdown.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
