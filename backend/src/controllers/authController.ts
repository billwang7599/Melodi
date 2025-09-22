import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Please provide email, password, and username' });
        }

        // Email validation: must contain @ and then .
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email must be in the format: example@domain.com' });
        }

        // Username validation: 3-16 characters
        if (username.length < 3 || username.length > 16) {
            return res.status(400).json({ message: 'Username must be between 3 and 16 characters long' });
        }

        // Password validation: must be at least 8 characters and contain at least one number
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        
        const hasNumber = /\d/.test(password);
        if (!hasNumber) {
            return res.status(400).json({ message: 'Password must contain at least one numerical character' });
        }

        const db = await getDatabase();
        
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
            [email, username, hashedPassword]
        );
        
        const newUser = { id: result.lastID, username };

        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
        });

        res.status(201).json({ token, userId: newUser.id, username: newUser.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const db = await getDatabase();
        
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
        });

        res.status(200).json({ token, userId: user.id, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const allUsers = await db.all('SELECT id, email, username, created_at FROM users');
        res.status(200).json(allUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
