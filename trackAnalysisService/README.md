# Track Analysis Service

This service provides automated audio analysis for Spotify tracks using the Essentia library and machine learning models. It is designed to extract musical features, generate embeddings, and predict valence/arousal (VA) values for any given Spotify track.

## How It Works

The core logic is implemented in [`analyze_track.py`](./analyze_track.py), primarily through the `TrackAnalyzer` class.

### Workflow

1. **Spotify Track Info**
   - Given a Spotify track ID, the service uses the Spotify API to fetch the track's artist and title.

2. **Audio Download**
   - It searches YouTube for the track and downloads the best available audio using `yt-dlp`.

3. **Essentia Analysis**
   - The downloaded audio is analyzed using Essentia's `MusicExtractor` to extract a wide range of musical features (e.g., key, tempo, danceability).

4. **ML Embeddings & VA Prediction**
   - The audio is processed through MusiCNN and a VA prediction model to generate:
     - **Embeddings:** High-level audio representations.
     - **VA Predictions:** Frame-wise valence and arousal values, normalized to the range [-1, 1].
     - **Averages:** The mean valence and arousal values for the track, also normalized.

5. **Result Aggregation**
   - All results are combined into a single JSON file named after the track (e.g., `analysis_results/Title.json`), with the following structure:
     ```json
     {
       "analysis": { ... },
       "embeddings": [ ... ],
       "va": {
         "predictions": [ [valence, arousal], ... ],
         "valence_average": ...,
         "arousal_average": ...
       }
     }
     ```

6. **Usage**
   - You can use the `TrackAnalyzer` class directly in your code or via the CLI:
     ```bash
     python analyze_track.py <spotify_track_id>
     ```
   - For API integration, see `main.py` for a FastAPI endpoint example.

## Example

```python
from analyze_track import TrackAnalyzer

analyzer = TrackAnalyzer()
result = analyzer.process_track("3n3Ppam7vgaVa1iaRUc9Lp")  # Example Spotify track ID
print(result)
```

## TODO

- **Make async:** Refactor the workflow to use asynchronous I/O for faster API responses and better scalability.
