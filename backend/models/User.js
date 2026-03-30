const { pool } = require('../config/database');

class User {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                theme VARCHAR(10) DEFAULT 'light',
                email_notifications BOOLEAN DEFAULT FALSE,
                sms_notifications BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await pool.execute(query);
    }

    static async create(userData) {
        const { email, password, name, phone } = userData;
        const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute(query, [email, password, name, phone || null]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, email, name, phone, theme, email_notifications, sms_notifications, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async updateTheme(userId, theme) {
        const query = 'UPDATE users SET theme = ? WHERE id = ?';
        await pool.execute(query, [theme, userId]);
    }

    static async updateProfile(userId, data) {
        const { name, phone, email_notifications, sms_notifications } = data;
        const query = `
            UPDATE users 
            SET name = ?, phone = ?, email_notifications = ?, sms_notifications = ? 
            WHERE id = ?
        `;
        await pool.execute(query, [name, phone || null, email_notifications || false, sms_notifications || false, userId]);
    }

    static async getUsersWithEmailReminders() {
        const query = `
            SELECT u.*, h.id as habit_id, h.name as habit_name, h.reminder_time
            FROM users u
            JOIN habits h ON u.id = h.user_id
            WHERE u.email_notifications = TRUE 
            AND h.reminder_enabled = TRUE
            AND h.reminder_time IS NOT NULL
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async getUsersWithSMSReminders() {
        const query = `
            SELECT u.*, h.id as habit_id, h.name as habit_name, h.reminder_time
            FROM users u
            JOIN habits h ON u.id = h.user_id
            WHERE u.sms_notifications = TRUE 
            AND u.phone IS NOT NULL
            AND h.reminder_enabled = TRUE
            AND h.reminder_time IS NOT NULL
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }
}

module.exports = User;
