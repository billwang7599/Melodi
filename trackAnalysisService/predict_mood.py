import os
import numpy as np
from supabase_connection import SupabaseConnection


class PredictMood:
    def __init__(self, results_dir="analysis_results", supabase=None):
        self.results_dir = results_dir
        self.supabase = supabase or SupabaseConnection()

    def predict(self, song_ids: list[str]):
        """
        Predict mood for a given song name (local file) or list of songIds (Supabase).
        If song_ids is provided, fetch valence/arousal from Supabase and use those for calculation.
        Returns a dict with normalized valence/arousal and mood similarity percentages.
        Raises FileNotFoundError or ValueError on error.
        """
        # Use Supabase to fetch valence/arousal for each songId
        songs = self.supabase.get_songs_by_ids(song_ids)
        if not songs or len(songs) == 0:
            raise FileNotFoundError(f"No songs found for provided songIds: {song_ids}")
        valence_arousal_list = []
        for song in songs:
            if "valence" in song and "arousal" in song:
                valence_arousal_list.append([song["valence"], song["arousal"]])
        if not valence_arousal_list:
            raise ValueError("No valence/arousal data found for provided songIds.")
        predictions_array = np.array(valence_arousal_list)
        avg = predictions_array.mean(axis=0)
        valence, arousal = avg[0], avg[1]

        percentages = self._mood_percentages(valence, arousal)
        return {
            "valence_score": valence,
            "arousal_score": arousal,
            "mood_percentages": percentages,
        }

    def _mood_percentages(self, valence, arousal):
        moods = {
            "ecstatic": (1, 1),
            "anxious": (-1, 1),
            "serene": (1, -1),
            "depressed": (-1, -1),
            "neutral": (0, 0),
        }
        max_distance = np.sqrt(8)
        result = np.array([valence, arousal])
        percentages = {}
        for mood, coords in moods.items():
            mood_coords = np.array(coords)
            distance = np.linalg.norm(result - mood_coords)
            similarity = 1 - (distance / max_distance)
            percentages[mood] = round(similarity * 100, 2)
        return percentages
