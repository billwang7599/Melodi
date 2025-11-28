import { Router } from "express";
import {
    listSavedSongs,
    saveSong,
    removeSavedSong,
} from "../controllers/savedSongsController";

const router = Router();

// Get all saved songs for a user
router.get("/", listSavedSongs);

// Save a new song for a user
router.post("/", saveSong);

// Remove a saved song for a user
router.delete("/:songId", removeSavedSong);

export default router;
