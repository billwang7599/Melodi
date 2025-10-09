import { Router } from 'express';
import {
    createSong,
    createSongFromSpotify,
    getSongById,
    getSongBySpotifyId
} from '../controllers/songsController';

const router = Router();

// Create a new song
router.post('/', createSong);

// Create song from Spotify API response
router.post('/from-spotify', createSongFromSpotify);

// Get song by Spotify ID
router.get('/spotify/:spotifyId', getSongBySpotifyId);

// Get song by database ID
router.get('/:songId', getSongById);

export default router;