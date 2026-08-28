if (!global.crypto) {
    global.crypto = require('crypto');
}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const path = require('path');
const staffRoutes = require('./routes/staffRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const rosterRoutes = require('./routes/rosterRoutes');
const authRoutes = require('./routes/authRoutes');
const Staff = require('./models/staff');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staff-roster';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (PWA)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/rosters', rosterRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Fallback for SPA/PWA navigation (serve index.html for non-API GET requests)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
        return res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
    next();
});

// Database Connection & Server Startup
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB database successfully.');

        // Initialize admin if none exists
        try {
            const adminExists = await Staff.findOne({ role: 'admin' });
            if (!adminExists) {
                // Find Aisha or first staff member
                let target = await Staff.findOne({ name: { $regex: /aisha/i } });
                if (!target) {
                    target = await Staff.findOne({});
                }
                if (target) {
                    target.role = 'admin';
                    target.pin = '1234';
                    await target.save();
                    console.log(`Initialized Admin user: ${target.name} (${target.phonenumber})`);
                }
            }
            // Ensure all staff have pin
            await Staff.updateMany({ pin: { $exists: false } }, { $set: { pin: '1234' } });
        } catch (initErr) {
            console.warn('Admin init check warning:', initErr.message);
        }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
