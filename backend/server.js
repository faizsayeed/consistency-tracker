require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const { testConnection } = require('./config/database');
const User = require('./models/User');
const Habit = require('./models/Habit');
const HabitLog = require('./models/HabitLog');
const notificationService = require('./services/notificationService');

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: [
    'https://consistency-tracker-1hqe.vercel.app', // ✅ your frontend
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (for serving frontend)
app.use(express.static('../frontend'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test notifications endpoint
app.get('/api/test-notifications', async (req, res) => {
    try {
        console.log('Testing notifications...');
        
        const emailUsers = await User.getUsersWithEmailReminders();
        const smsUsers = await User.getUsersWithSMSReminders();
        
        console.log(`Email users: ${emailUsers.length}, SMS users: ${smsUsers.length}`);
        
        if (emailUsers.length > 0) {
            await notificationService.checkAndSendReminders(emailUsers);
        }
        if (smsUsers.length > 0) {
            await notificationService.checkAndSendReminders(smsUsers);
        }
        
        res.json({ 
            message: 'Test notifications sent',
            emailUsers: emailUsers.length,
            smsUsers: smsUsers.length
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notifications' });
    }
});
// Start server
async function startServer() {
    await testConnection();
    await initDatabase();
    initNotificationService();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
