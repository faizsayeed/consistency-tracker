const mysql = require('mysql2/promise');

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'consistency_tracker';

    try {
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`Database '${dbName}' created or already exists`);
        
        await connection.execute(`USE ${dbName}`);
        console.log(`Using database '${dbName}'`);
        
        console.log('Database setup complete!');
    } catch (error) {
        console.error('Database setup error:', error);
    } finally {
        await connection.end();
    }
}

setupDatabase();
