const { pool } = require('../config/database');

class HabitLog {
    static formatDateLocal(dateLike) {
        const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS habit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                habit_id INT NOT NULL,
                user_id INT NOT NULL,
                log_date DATE NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_habit_date (habit_id, log_date),
                FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.execute(query);
    }

    static async logCompletion(habitId, userId, date, completed) {
        const query = `
            INSERT INTO habit_logs (habit_id, user_id, log_date, completed) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE completed = ?, updated_at = CURRENT_TIMESTAMP
        `;
        await pool.execute(query, [habitId, userId, date, completed, completed]);
    }

    static async getByDate(userId, date) {
        const query = `
            SELECT hl.*, h.name as habit_name, h.category 
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE hl.user_id = ? AND hl.log_date = ?
        `;
        const [rows] = await pool.execute(query, [userId, date]);
        return rows;
    }

    static async getByDateRange(userId, startDate, endDate, habitId = null) {
        let query = `
            SELECT hl.*, h.name as habit_name, h.category 
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE hl.user_id = ? AND hl.log_date BETWEEN ? AND ?
        `;
        const params = [userId, startDate, endDate];
        
        if (habitId) {
            query += ' AND hl.habit_id = ?';
            params.push(habitId);
        }
        
        query += ' ORDER BY hl.log_date DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async getHeatmapData(userId, startDate, endDate) {
        // Get all habits for the user
        const [habitsResult] = await pool.execute(
            'SELECT id, name FROM habits WHERE user_id = ?',
            [userId]
        );
        const habits = habitsResult;

        // Get completion data grouped by date and habit
        const query = `
            SELECT 
                log_date,
                habit_id,
                completed
            FROM habit_logs
            WHERE user_id = ? AND log_date BETWEEN ? AND ?
            ORDER BY log_date, habit_id
        `;
        const [rows] = await pool.execute(query, [userId, startDate, endDate]);
        
        // Create a map of completions by date
        const dataMap = {};
        rows.forEach(row => {
            const key = HabitLog.formatDateLocal(row.log_date);
            if (!dataMap[key]) {
                dataMap[key] = {
                    total_habits: habits.length,
                    completed_habits: [],
                    completed_count: 0
                };
            }
            if (row.completed) {
                dataMap[key].completed_habits.push(row.habit_id);
                dataMap[key].completed_count++;
            }
        });

        // Generate array with ALL dates in range
        const result = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = HabitLog.formatDateLocal(d);
            const dayData = dataMap[dateStr] || {
                total_habits: habits.length,
                completed_habits: [],
                completed_count: 0
            };
            
            // Calculate percentage based on habits completed
            const percentage = habits.length > 0 ? Math.round((dayData.completed_count / habits.length) * 100) : 0;
            
            result.push({
                log_date: dateStr,
                completed_count: dayData.completed_count,
                total_habits: habits.length,
                completed_habits: dayData.completed_habits,
                percentage: percentage
            });
        }
        
        return result;
    }

    static async getSingleHabitHeatmapData(userId, habitId, startDate, endDate) {
        // Verify the habit belongs to this user
        const [habitCheck] = await pool.execute(
            'SELECT id FROM habits WHERE id = ? AND user_id = ?',
            [habitId, userId]
        );
        
        if (habitCheck.length === 0) {
            throw new Error('Habit not found');
        }

        // Get completion data for specific habit
        const query = `
            SELECT 
                log_date,
                completed
            FROM habit_logs
            WHERE user_id = ? AND habit_id = ? AND log_date BETWEEN ? AND ?
            ORDER BY log_date
        `;
        const [rows] = await pool.execute(query, [userId, habitId, startDate, endDate]);
        
        // Create a map of completions by date
        const dataMap = {};
        rows.forEach(row => {
            const key = HabitLog.formatDateLocal(row.log_date);
            dataMap[key] = {
                completed_count: row.completed ? 1 : 0,
                total_habits: 1,
                percentage: row.completed ? 100 : 0
            };
        });

        // Generate array with ALL dates in range
        const result = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);
        
        while (current <= end) {
            const dateStr = HabitLog.formatDateLocal(current);
            result.push(dataMap[dateStr] || {
                log_date: dateStr,
                completed_count: 0,
                total_habits: 1,
                percentage: 0
            });
            
            current.setDate(current.getDate() + 1);
        }
        
        return result;
    }

    static async getStats(userId, startDate, endDate) {
        // Get total habits count
        const [habitCountResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM habits WHERE user_id = ?',
            [userId]
        );
        const totalHabits = habitCountResult[0]?.total || 0;

        if (totalHabits === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }

        // Get completion data for the date range
        const query = `
            SELECT 
                COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed,
                COUNT(*) as total_logs
            FROM habit_logs
            WHERE user_id = ? AND log_date BETWEEN ? AND ?
        `;
        const [rows] = await pool.execute(query, [userId, startDate, endDate]);
        
        const completed = rows[0]?.completed || 0;
        
        // Calculate: what percentage of possible habit completions were actually done
        // total possible = days in range * total habits
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysInRange = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const totalPossible = daysInRange * totalHabits;
        
        const percentage = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
        
        return {
            completed: completed,
            total: totalPossible,
            percentage: percentage
        };
    }
}

module.exports = HabitLog;
