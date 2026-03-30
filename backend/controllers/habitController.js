const Habit = require('../models/Habit');

exports.getHabits = async (req, res) => {
    try {
        const habits = await Habit.findByUserId(req.user.userId);
        res.json({ habits });
    } catch (error) {
        console.error('Get habits error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createHabit = async (req, res) => {
    try {
        const { name, category, description, reminder_time, reminder_enabled } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        const habitId = await Habit.create({
            user_id: req.user.userId,
            name,
            category,
            description,
            reminder_time,
            reminder_enabled
        });

        const habit = await Habit.findById(habitId);
        res.status(201).json({ habit });
    } catch (error) {
        console.error('Create habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateHabit = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, reminder_time, reminder_enabled } = req.body;

        const existingHabit = await Habit.findById(id);
        if (!existingHabit || existingHabit.user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        await Habit.update(id, { name, category, description, reminder_time, reminder_enabled });
        const habit = await Habit.findById(id);
        res.json({ habit });
    } catch (error) {
        console.error('Update habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteHabit = async (req, res) => {
    try {
        const { id } = req.params;

        const existingHabit = await Habit.findById(id);
        if (!existingHabit || existingHabit.user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        await Habit.delete(id);
        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        console.error('Delete habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
