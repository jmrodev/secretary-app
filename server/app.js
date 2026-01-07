const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');

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
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/insurances', require('./routes/insuranceRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/', (req, res) => {
    res.send('Secretary App API is running');
});
// Force restart

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MariaDB');
        conn.release();
    } catch (err) {
        console.error('Failed to connect to MariaDB:', err);
    }
});
