import { Request, Response } from "express";
import { getDatabase } from "../db";

// env variables
const ANALYSIS_URL = process.env.ANALYSIS_URL;

// Helper function to get Spotify access token
const getSpotifyAccessToken = async (): Promise<string> => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Spotify credentials not configured");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        throw new Error("Failed to get Spotify access token");
    }

    const data = await response.json();
    return data.access_token;
};

// Helper function to fetch track from Spotify API
const fetchSpotifyTrack = async (spotifyId: string) => {
    const accessToken = await getSpotifyAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/tracks/${spotifyId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Track not found on Spotify");
        }
        throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
};

// fetch song data from internal API
const fetchTrackData = async (spotifyId: string) => {
    const response = await fetch(`${ANALYSIS_URL}/analyze?songid=${spotifyId}`);

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
};

// Helper function to create or get existing song (exported for reuse)
export const createOrGetSong = async (spotifyId: string, supabase: any) => {
    // Check if song already exists
    const { data: existingSong } = await supabase
        .from("songs")
        .select("*")
        .eq("spotify_id", spotifyId)
        .single();

    if (existingSong) {
        return existingSong;
    }

    // Fetch track data from Spotify API
    const spotifyTrack = await fetchSpotifyTrack(spotifyId);
    const data = await fetchTrackData(spotifyId);

    // Extract data from Spotify API response
    const songData = {
        spotifyId: spotifyTrack.id,
        songName: spotifyTrack.name,
        artistName: spotifyTrack.artists?.[0]?.name,
        albumName: spotifyTrack.album?.name,
        coverArtUrl: spotifyTrack.album?.images?.[0]?.url,

        analysis: data.analysis,
        embedding: data.embeddings,
        valence: data.va.valence_average,
        arousal: data.va.arousal_average,
        va_prediction: data.va.predictions,
    };

    // Create new song
    const { data: newSong, error } = await supabase
        .from("songs")
        .insert([
            {
                spotify_id: songData.spotifyId,
                song_name: songData.songName,
                artist_name: songData.artistName,
                album_name: songData.albumName || null,
                cover_art_url: songData.coverArtUrl || null,
                analysis: songData.analysis,
                embedding: songData.embedding,
                valence: songData.valence,
                arousal: songData.arousal,
                va_prediction: songData.va_prediction,
            },
        ])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return newSong;
};

// Create a new song (or return existing if it already exists)
export const createSong = async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.body;

        // Validate required fields
        if (!spotifyId) {
            return res.status(400).json({
                message: "Spotify ID is required",
            });
        }

        const supabase = await getDatabase();

        // Use the helper function to create or get existing song
        const newSong = await createOrGetSong(spotifyId, supabase);

        res.status(201).json({
            message: "Song created successfully",
            song: newSong,
        });
    } catch (error) {
        console.error("Error in createSong:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get song by Spotify ID
export const getSongBySpotifyId = async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;

        if (!spotifyId) {
            return res.status(400).json({ message: "Spotify ID is required" });
        }

        const supabase = await getDatabase();

        const { data: song, error } = await supabase
            .from("songs")
            .select("*")
            .eq("spotify_id", spotifyId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // No rows returned
                return res.status(404).json({ message: "Song not found" });
            }
            console.error("Error fetching song:", error);
            throw error;
        }

        res.status(200).json({
            message: "Song retrieved successfully",
            song,
        });
    } catch (error) {
        console.error("Error in getSongBySpotifyId:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get song by database ID
export const getSongById = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;

        if (!songId) {
            return res.status(400).json({ message: "Song ID is required" });
        }

        const supabase = await getDatabase();

        const { data: song, error } = await supabase
            .from("songs")
            .select("*")
            .eq("song_id", songId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // No rows returned
                return res.status(404).json({ message: "Song not found" });
            }
            console.error("Error fetching song:", error);
            throw error;
        }

        res.status(200).json({
            message: "Song retrieved successfully",
            song,
        });
    } catch (error) {
        console.error("Error in getSongById:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Create song from Spotify API response (helper function)
export const createSongFromSpotify = async (req: Request, res: Response) => {
    try {
        const spotifyTrack = req.body;

        // Extract data from Spotify API response
        const songData = {
            spotifyId: spotifyTrack.id,
            songName: spotifyTrack.name,
            artistName: spotifyTrack.artists?.[0]?.name,
            albumName: spotifyTrack.album?.name,
            coverArtUrl: spotifyTrack.album?.images?.[0]?.url,
            durationMs: spotifyTrack.duration_ms,
            previewUrl: spotifyTrack.preview_url,
            popularity: spotifyTrack.popularity,
        };

        // Validate required fields
        if (!songData.spotifyId || !songData.songName || !songData.artistName) {
            return res.status(400).json({
                message: "Invalid Spotify track data: missing required fields",
            });
        }

        const supabase = await getDatabase();

        // Check if song already exists
        const { data: existingSong } = await supabase
            .from("songs")
            .select("*")
            .eq("spotify_id", songData.spotifyId)
            .single();

        if (existingSong) {
            return res.status(200).json({
                message: "Song already exists",
                song: existingSong,
            });
        }

        // Create new song
        const { data: newSong, error } = await supabase
            .from("songs")
            .insert([
                {
                    spotify_id: songData.spotifyId,
                    song_name: songData.songName,
                    artist_name: songData.artistName,
                    album_name: songData.albumName || null,
                    cover_art_url: songData.coverArtUrl || null,
                    duration_ms: songData.durationMs || null,
                    preview_url: songData.previewUrl || null,
                    popularity: songData.popularity || null,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating song from Spotify:", error);
            throw error;
        }

        res.status(201).json({
            message: "Song created successfully from Spotify data",
            song: newSong,
        });
    } catch (error) {
        console.error("Error in createSongFromSpotify:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
