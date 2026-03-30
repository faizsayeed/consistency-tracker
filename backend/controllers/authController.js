const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await User.create({ email, password: hashedPassword, name });

        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: userId, email, name }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                phone: user.phone,
                theme: user.theme,
                email_notifications: user.email_notifications,
                sms_notifications: user.sms_notifications
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateTheme = async (req, res) => {
    try {
        const { theme } = req.body;
        await User.updateTheme(req.user.userId, theme);
        res.json({ message: 'Theme updated successfully' });
    } catch (error) {
        console.error('Update theme error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, email_notifications, sms_notifications } = req.body;
        console.log('Update profile request:', { userId: req.user.userId, name, phone, email_notifications, sms_notifications });
        
        await User.updateProfile(req.user.userId, { name, phone, email_notifications, sms_notifications });
        
        const updatedUser = await User.findById(req.user.userId);
        console.log('Profile updated successfully:', updatedUser);
        res.json({ 
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
