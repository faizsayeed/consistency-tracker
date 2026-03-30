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
        
        // Get users with reminders
        const emailUsers = await User.getUsersWithEmailReminders();
        const smsUsers = await User.getUsersWithSMSReminders();
        
        console.log(`Email users: ${emailUsers.length}, SMS users: ${smsUsers.length}`);
        
        // Send test notifications immediately
        if (emailUsers.length > 0) {
            await notificationService.checkAndSendReminders(emailUsers);
        }
        if (smsUsers.length > 0) {
            await notificationService.checkAndSendReminders(smsUsers);
        }
        
        res.json({ 
            message: 'Test notifications sent',
            emailUsers: emailUsers.length,
            smsUsers: smsUsers.length,
            currentTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notifications' });
    }
});

// Root route - serve frontend
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../frontend' });
});

// Initialize database tables
async function initDatabase() {
    try {
        await User.createTable();
        await Habit.createTable();
        await HabitLog.createTable();
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Notification service (cron job for reminders)
function initNotificationService() {
    // Check for reminders every 30 seconds for testing (change to '* * * * *' for production)
    cron.schedule('*/30 * * * * *', async () => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const currentSeconds = now.getSeconds();
        
        console.log(`[${now.toISOString()}] Notification check running at ${currentTime}:${String(currentSeconds).padStart(2, '0')}`);
        
        try {
            // Get users with email reminders enabled
            const emailUsers = await User.getUsersWithEmailReminders();
            console.log(`Found ${emailUsers.length} users with email reminders`);
            if (emailUsers.length > 0) {
                await notificationService.checkAndSendReminders(emailUsers);
            }
            
            // Get users with SMS reminders enabled
            const smsUsers = await User.getUsersWithSMSReminders();
            console.log(`Found ${smsUsers.length} users with SMS reminders`);
            if (smsUsers.length > 0) {
                await notificationService.checkAndSendReminders(smsUsers);
            }
            
            if (emailUsers.length > 0 || smsUsers.length > 0) {
                console.log(`Checked reminders at ${currentTime}`);
            }
        } catch (error) {
            console.error('Notification service error:', error);
        }
    });
    console.log('Notification service initialized (checking every 30 seconds)');
}

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
