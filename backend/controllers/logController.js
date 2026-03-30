const HabitLog = require('../models/HabitLog');

exports.logCompletion = async (req, res) => {
    try {
        const { habit_id, date, completed } = req.body;

        if (!habit_id || !date) {
            return res.status(400).json({ error: 'Habit ID and date are required' });
        }

        await HabitLog.logCompletion(habit_id, req.user.userId, date, completed);
        res.json({ message: 'Completion logged successfully' });
    } catch (error) {
        console.error('Log completion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const logs = await HabitLog.getByDate(req.user.userId, date);
        res.json({ logs });
    } catch (error) {
        console.error('Get by date error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getByDateRange = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { habitId } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const logs = await HabitLog.getByDateRange(req.user.userId, start, end, habitId || null);
        res.json({ logs });
    } catch (error) {
        console.error('Get by date range error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHeatmapData = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const data = await HabitLog.getHeatmapData(req.user.userId, start, end);
        res.json({ data });
    } catch (error) {
        console.error('Get heatmap data error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getSingleHabitHeatmapData = async (req, res) => {
    try {
        const { habitId } = req.params;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        if (!habitId) {
            return res.status(400).json({ error: 'Habit ID is required' });
        }

        const data = await HabitLog.getSingleHabitHeatmapData(req.user.userId, habitId, start, end);
        res.json({ data });
    } catch (error) {
        console.error('Get single habit heatmap data error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const stats = await HabitLog.getStats(req.user.userId, start, end);
        res.json({ stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
