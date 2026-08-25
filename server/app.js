const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const systemSettingsRepository = require('./repositories/system/systemSettingsRepository');
const { safeJsonReplacer } = require('./utils/system/safeJson');

const authRoutes = require('./routes/user/authRoutes');
const institutionRoutes = require('./routes/core/institutionRoutes');

const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
dotenv.config();

// Define Global Rate Limiter (satisfies CodeQL js/missing-rate-limiting)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000, // Increased to 5000 to avoid blocking during development/intense use
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Register Event Listeners
require('./listeners/appointmentListeners');
require('./listeners/financeListener');

const { initScheduler } = require('./utils/system/scheduler');

const app = express();
app.set('trust proxy', 1);
app.set('json replacer', safeJsonReplacer);

// Apply Security Middlewares
app.use(globalLimiter);
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
// Self-learning: Detect if staff is accessing via a LAN IP and update staff_base_url
let lastDetectedStaffIp = null;
app.use(async (req, res, next) => {
    res.setHeader('Bypass-Tunnel-Reminder', 'true');

    // Self-learning: Detect if staff is accessing via a LAN IP and update staff_base_url
    try {
        const host = req.get('host'); // e.g. "192.168.1.50:5000"
        if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1') && !host.endsWith('.trycloudflare.com')) {
            const ipPart = host.split(':')[0];
            // Check if it's a private IPv4 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ipPart);

            if (isPrivate) {
                const staffUrl = `http://${host}`;

                // Only update if different to avoid constant DB writes
                if (lastDetectedStaffIp !== staffUrl) {
                    lastDetectedStaffIp = staffUrl;
                    await systemSettingsRepository.upsert('staff_base_url', staffUrl);
                    console.log(`🤖 Auto-detected Staff LAN IP: ${staffUrl}`);
                }
            }
        }
    } catch (err) {
        // Log and continue — IP detection must never block the request
        console.error('Staff IP detection failed:', err);
    }

    next();
});

// SPA Fallback: Redirect common frontend routes to root for HashRouter compatibility
const frontendRoutes = ['/login', '/register', '/dashboard', '/patients', '/appointments', '/finances', '/p/register'];
app.get(frontendRoutes, (req, res) => {
    res.redirect('/#' + req.path);
});

// Extract Doctor Context from Headers
app.use((req, res, next) => {
    const doctorId = req.headers['x-doctor-id'];
    if (doctorId && doctorId !== 'undefined' && doctorId !== 'null' && doctorId !== '') {
        req.doctorId = doctorId;
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/user/userRoutes'));
app.use('/api/appointments', require('./routes/appointments/appointmentRoutes'));
app.use('/api/consultorios', require('./routes/core/consultorioRoutes'));
app.use('/api/medical', require('./routes/medical/medicalRoutes'));
app.use('/api/whatsapp', require('./routes/communication/whatsappRoutes'));

const transactionRepository = require('./repositories/finance/transactionRepository');
const FinanceController = require('./controllers/finance/financeController');
const financeController = new FinanceController(transactionRepository);
const financeRoutes = require('./routes/finance/financeRoutes')(financeController);
app.use('/api/finances', financeRoutes);
app.use('/api/logs', require('./routes/system/logRoutes'));
app.use('/api/google', require('./routes/integrations/googleRoutes'));
app.use('/api/import', require('./routes/system/importRoutes'));
app.use('/api/settings', require('./routes/system/settingsRoutes'));
app.use('/api/insurances', require('./routes/core/insuranceRoutes'));
app.use('/api/holidays', require('./routes/appointments/holidayRoutes'));
app.use('/api/messages', require('./routes/communication/messageRoutes'));
app.use('/api/outreach', require('./routes/communication/outreachRoutes'));
app.use('/api/temp-access', require('./routes/system/tempAccessRoutes'));
app.use('/api/institutions', institutionRoutes);
app.use('/api/schedules', require('./routes/appointments/scheduleRoutes'));
app.use('/api/billing', require('./routes/finance/billingRoutes'));
app.use('/uploads', express.static('uploads'));



// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await db.dbReady;
        const conn = await db.pool.getConnection();
        console.log('Connected to MariaDB');

        // Debug: Identify DB
        const dbInfo = await conn.query("SELECT DATABASE() as db, @@hostname as host");
        console.log("!!! CONNECTED TO DB:", dbInfo[0]?.db);

        conn.release();


        // Start Google Sync Worker
        const { startSyncWorker } = require('./services/integrations/googleSyncService');
        startSyncWorker();

        // Start WhatsApp Bridge (Go)
        // The bridge is now managed by docker-compose
        // const whatsappBridgeService = require('./services/communication/whatsappBridgeService');
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
        db.pool.end().then(() => {
            console.log('💾 Database connections closed.');
            process.exit(0);
        }).catch((err) => {
            console.error('Failed to close database connections:', err);
            process.exit(1);
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
