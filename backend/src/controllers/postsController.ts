import { Request, Response } from 'express';
import { getDatabase } from '../db';
import { createOrGetSong } from './songsController';

// Create a new post
export const createPost = async (req: Request, res: Response) => {
    try {
        const { userId, content, spotifyId, visibility = 'public' } = req.body;

        // Validate required fields
        if (!userId || !content || !spotifyId) {
            return res.status(400).json({ 
                message: 'User ID, content, and Spotify ID are required' 
            });
        }

        const supabase = await getDatabase();

        // Verify user exists
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create or get existing song
        const song = await createOrGetSong(spotifyId, supabase);

        // Create the post
        const { data: newPost, error } = await supabase
            .from('posts')
            .insert([
                {
                    userId: userId,
                    content,
                    topSongId: song.song_id,
                    visibility,
                    like_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select(`
                post_id,
                userId,
                content,
                topSongId,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:userId (
                    id,
                    username,
                    display_name
                ),
                songs:topSongId (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating post:', error);
            throw error;
        }

        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });

    } catch (error) {
        console.error('Error in createPost:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get posts for a specific user
export const getPostsByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();

        // Verify user exists
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get posts for the user with related data
        const { data: posts, error, count } = await supabase
            .from('posts')
            .select(`
                post_id,
                user_id,
                content,
                top_song_id,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    username,
                    display_name
                ),
                songs:top_song_id (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }

        res.status(200).json({
            message: 'Posts retrieved successfully',
            posts: posts || [],
            pagination: {
                total: count || 0,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: (count || 0) > Number(offset) + Number(limit)
            }
        });

    } catch (error) {
        console.error('Error in getPostsByUserId:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get all posts (for feed functionality - bonus)
export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const { limit = 20, offset = 0, visibility = 'public' } = req.query;

        const supabase = await getDatabase();

        // Get all posts with related data
        const { data: posts, error, count } = await supabase
            .from('posts')
            .select(`
                post_id,
                user_id,
                content,
                top_song_id,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    username,
                    display_name
                ),
                songs:top_song_id (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                )
            `, { count: 'exact' })
            .eq('visibility', visibility)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (error) {
            console.error('Error fetching all posts:', error);
            throw error;
        }

        res.status(200).json({
            message: 'Posts retrieved successfully',
            posts: posts || [],
            pagination: {
                total: count || 0,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: (count || 0) > Number(offset) + Number(limit)
            }
        });

    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};