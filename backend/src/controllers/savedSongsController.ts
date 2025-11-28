import { Request, Response } from "express";
import { getDatabase } from "../db";

// List all saved songs for a user
export const listSavedSongs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const supabase = await getDatabase();

        const { data: savedSongs, error } = await supabase
            .from("saved_songs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching saved songs:", error);
            throw error;
        }

        res.status(200).json({
            message: "Saved songs retrieved successfully",
            savedSongs,
        });
    } catch (error) {
        console.error("Error in listSavedSongs:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Save a new song for a user
export const saveSong = async (req: Request, res: Response) => {
    try {
        const { userId, songId } = req.body;

        if (!userId || !songId) {
            return res
                .status(400)
                .json({ message: "userId and songId are required" });
        }

        const supabase = await getDatabase();

        // Check if already saved
        const { data: existing, error: existingError } = await supabase
            .from("saved_songs")
            .select("*")
            .eq("user_id", userId)
            .eq("song_id", songId)
            .single();

        if (existing) {
            return res.status(200).json({
                message: "Song already saved",
                savedSong: existing,
            });
        }

        if (existingError && existingError.code !== "PGRST116") {
            // PGRST116 = no rows found, which is expected if not saved yet
            throw existingError;
        }

        // Insert new saved song
        const { data: savedSong, error } = await supabase
            .from("saved_songs")
            .insert([
                {
                    user_id: userId,
                    song_id: songId,
                },
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: "Song saved successfully",
            savedSong,
        });
    } catch (error) {
        console.error("Error in saveSong:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Remove a saved song for a user
export const removeSavedSong = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;
        const { userId } = req.body;

        if (!userId || !songId) {
            return res
                .status(400)
                .json({ message: "userId and songId are required" });
        }

        const supabase = await getDatabase();

        const { error } = await supabase
            .from("saved_songs")
            .delete()
            .eq("user_id", userId)
            .eq("song_id", songId);

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: `Song with id ${songId} removed from saved songs`,
        });
    } catch (error) {
        console.error("Error in removeSavedSong:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
