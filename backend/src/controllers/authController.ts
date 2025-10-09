import { Request, Response } from 'express';
import { getDatabase } from '../db';

// Sync user from Supabase Auth to custom users table
export const syncUser = async (req: Request, res: Response) => {
    try {
        const { userId, email, username, displayName, spotifyId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();

        const { data, error: testError } = await supabase.from('users').select('*').limit(1)
        console.log('Test select result:', data, testError)
        
        // Check if user already exists in our custom table
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (existingUser) {
            return res.status(200).json({ 
                message: 'User already exists', 
                user: existingUser 
            });
        }

        // Insert new user into our custom users table
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                { 
                    id: userId,
                    email: email || null,
                    username: username || email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
                    display_name: displayName || null,
                    spotify_id: spotifyId || null
                }
            ])
            .select()
            .single();
            
        if (error) {
            throw error;
        }

        res.status(201).json({ 
            message: 'User synced successfully', 
            user: newUser 
        });
    } catch (error) {
        console.error('Sync user error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user profile from custom users table
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();
        
        // Get user from custom users table
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, username, displayName, spotifyId, createdAt')
            .eq('id', userId)
            .single();
            
        if (error || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const supabase = await getDatabase();
        
        const { data: allUsers, error } = await supabase
            .from('users')
            .select('id, email, username, created_at');
            
        if (error) {
            throw error;
        }
        
        res.status(200).json(allUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
