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

exports.getChartData = async (req, res) => {
    try {
        const { start, end } = req.query;
        console.log('getChartData called with start:', start, 'end:', end);

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        // Get all logs for the date range
        console.log('Fetching logs...');
        const logs = await HabitLog.getByDateRange(req.user.userId, start, end);
        console.log('Logs fetched:', logs.length);
        
        // Get all habits for the user
        console.log('Fetching habits...');
        const Habit = require('../models/Habit');
        const habits = await Habit.findByUserId(req.user.userId);
        console.log('Habits fetched:', habits.length);
        
        // Process data for charts
        const habitMap = {};
        const dateMap = {};
        
        habits.forEach(habit => {
            habitMap[habit.id] = {
                id: habit.id,
                name: habit.name,
                completed: 0,
                total: 0
            };
        });
        
        // Calculate completions per habit and per date
        logs.forEach(log => {
            const dateStr = log.log_date;
            
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { completed: 0, total: 0 };
            }
            
            if (habitMap[log.habit_id]) {
                habitMap[log.habit_id].total++;
                dateMap[dateStr].total++;
                
                if (log.completed) {
                    habitMap[log.habit_id].completed++;
                    dateMap[dateStr].completed++;
                }
            }
        });
        
        // Prepare bar chart data - completion rates per habit
        const barChartData = {
            labels: [],
            data: [],
            colors: []
        };
        
        const greenColors = ['#22c55e', '#4ade80', '#16a34a', '#14532d', '#166534', '#86efac'];
        let colorIndex = 0;
        
        Object.values(habitMap).forEach(habit => {
            if (habit.total > 0) {
                barChartData.labels.push(habit.name);
                const rate = Math.round((habit.completed / habit.total) * 100);
                barChartData.data.push(rate);
                barChartData.colors.push(greenColors[colorIndex % greenColors.length]);
                colorIndex++;
            }
        });
        
        // Prepare pie chart data - distribution of completions
        const pieChartData = {
            labels: [],
            data: [],
            colors: []
        };
        
        colorIndex = 0;
        Object.values(habitMap).forEach(habit => {
            if (habit.completed > 0) {
                pieChartData.labels.push(habit.name);
                pieChartData.data.push(habit.completed);
                pieChartData.colors.push(greenColors[colorIndex % greenColors.length]);
                colorIndex++;
            }
        });
        
        // Prepare line chart data - trend over time
        // Fill in all dates in the range, even those with no data
        console.log('Preparing line chart data...');
        
        // Helper function to format date
        function formatDateLocal(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        
        const sortedDates = [];
        const chartStart = new Date(start);
        const chartEnd = new Date(end);
        console.log('Chart start:', chartStart, 'Chart end:', chartEnd);
        
        const current = new Date(chartStart);
        let loopCount = 0;
        
        while (current <= chartEnd) {
            const dateStr = formatDateLocal(current);
            sortedDates.push(dateStr);
            current.setDate(current.getDate() + 1);
            loopCount++;
            if (loopCount > 1000) {
                console.error('Loop exceeded 1000 iterations, breaking');
                break;
            }
        }
        console.log('Generated', sortedDates.length, 'dates for line chart');
        
        const lineChartData = {
            labels: sortedDates.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            completed: sortedDates.map(date => dateMap[date]?.completed || 0),
            total: sortedDates.map(date => dateMap[date]?.total || 0)
        };
        
        console.log('Sending response...');
        res.json({
            barChart: barChartData,
            pieChart: pieChartData,
            lineChart: lineChartData
        });
    } catch (error) {
        console.error('Get chart data error:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};
