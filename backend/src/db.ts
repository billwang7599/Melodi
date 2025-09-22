import dotenv from 'dotenv';
import path from 'path';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

dotenv.config();

let db: Database | null = null;

export const initializeDatabase = async () => {
    if (!db) {
        db = await open({
            filename: path.join(__dirname, '..', 'database.sqlite'),
            driver: sqlite3.Database
        });
        
        // Create users table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Database initialized successfully');
    }
    return db;
};

export const getDatabase = async () => {
    if (!db) {
        await initializeDatabase();
    }
    return db!;
};
