import { Router } from "express";
import {
    createSongAnalysis,
    getSong,
    getAnalysisFor,
    moodAnalysis,
} from "../controllers/analysisController";

const router = Router();

// Create a new song analysis
router.post("/song/:songId", createSongAnalysis);

// Get song analysis by song ID
router.get("/song/:songId", getSong);

// Get song analysis for a range
router.post("/getAnalysisFor", getAnalysisFor);

// Get mood analysis for songs
router.get("/moodAnalysis", moodAnalysis);

export default router;
