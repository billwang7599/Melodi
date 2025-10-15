import sys
import os
import json
import numpy as np


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python predict_mood.py "Song Name"')
        sys.exit(1)

    song_name = sys.argv[1]
    json_filename = f"{song_name}_va.json"
    json_path = os.path.join("analysis_results", json_filename)

    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        sys.exit(1)

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        sys.exit(1)

    predictions = data.get("predictions")
    if predictions is None:
        print(f"'predictions' key not found in {json_path}")
        sys.exit(1)

    # Average predictions using numpy
    predictions_array = np.array(predictions)
    avg = predictions_array.mean(axis=0)
    # Normalize from 1-9 to -1 to 1
    norm = ((avg - 1) / 8) * 2 - 1
    result = (norm[0], norm[1])
    print("Normalized (valence, arousal):", result)

    # Calculate mood similarity percentages
    def mood_percentages(valence, arousal):
        moods = {
            "Ecstatic / Elated": (1, 1),
            "Anxious / Stressed": (-1, 1),
            "Serene / Content": (1, -1),
            "Depressed / Sad": (-1, -1),
            "Neutral": (0, 0),
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

    percentages = mood_percentages(norm[0], norm[1])
    print("\nMood similarity percentages:")
    for mood, percent in percentages.items():
        print(f"{mood}: {percent}%")
