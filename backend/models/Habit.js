const { pool } = require('../config/database');

class Habit {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS habits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                reminder_time TIME,
                reminder_enabled BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.execute(query);
    }

    static async create(habitData) {
        const { user_id, name, category, description, reminder_time, reminder_enabled } = habitData;
        
        // Convert various time formats to MySQL TIME format (HH:MM:SS)
        let timeValue = null;
        if (reminder_time) {
            // Handle ISO string like '1970-01-01T18:10:00.000Z' or '18:10'
            if (typeof reminder_time === 'string') {
                if (reminder_time.includes('T')) {
                    // ISO format: extract time part
                    timeValue = reminder_time.split('T')[1].split('.')[0]; // Gets HH:MM:SS
                } else if (reminder_time.includes(':')) {
                    // Already HH:MM or HH:MM:SS format
                    timeValue = reminder_time.length === 5 ? reminder_time + ':00' : reminder_time;
                }
            } else if (reminder_time instanceof Date) {
                timeValue = reminder_time.toISOString().split('T')[1].split('.')[0];
            }
        }
        
        const query = `
            INSERT INTO habits (user_id, name, category, description, reminder_time, reminder_enabled) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
            user_id, name, category, description || '', timeValue, reminder_enabled || false
        ]);
        return result.insertId;
    }

    static async findByUserId(userId) {
        const query = 'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC';
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM habits WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async update(id, habitData) {
        const { name, category, description, reminder_time, reminder_enabled } = habitData;
        
        // Convert various time formats to MySQL TIME format (HH:MM:SS)
        let timeValue = null;
        if (reminder_time) {
            // Handle ISO string like '1970-01-01T18:10:00.000Z' or '18:10'
            if (typeof reminder_time === 'string') {
                if (reminder_time.includes('T')) {
                    // ISO format: extract time part
                    timeValue = reminder_time.split('T')[1].split('.')[0]; // Gets HH:MM:SS
                } else if (reminder_time.includes(':')) {
                    // Already HH:MM or HH:MM:SS format
                    timeValue = reminder_time.length === 5 ? reminder_time + ':00' : reminder_time;
                }
            } else if (reminder_time instanceof Date) {
                timeValue = reminder_time.toISOString().split('T')[1].split('.')[0];
            }
        }
        
        const query = `
            UPDATE habits 
            SET name = ?, category = ?, description = ?, reminder_time = ?, reminder_enabled = ?
            WHERE id = ?
        `;
        await pool.execute(query, [name, category, description, timeValue, reminder_enabled, id]);
    }

    static async delete(id) {
        const query = 'DELETE FROM habits WHERE id = ?';
        await pool.execute(query, [id]);
    }
}

module.exports = Habit;
