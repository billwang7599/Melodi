import os
import json
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import yt_dlp
from dotenv import load_dotenv

import essentia.standard as es
import numpy as np

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()


class TrackAnalyzer:
    TEMP_AUDIO_DIR = "temp_audio"
    ANALYSIS_OUTPUT_DIR = "analysis_results"

    def __init__(self):
        os.makedirs(self.TEMP_AUDIO_DIR, exist_ok=True)
        os.makedirs(self.ANALYSIS_OUTPUT_DIR, exist_ok=True)

    def get_spotify_track_info(self, track_id):
        """Get artist and title for a given Spotify track ID."""
        try:
            auth_manager = SpotifyClientCredentials()
            sp = spotipy.Spotify(auth_manager=auth_manager)
            track_url = f"https://open.spotify.com/track/{track_id}"
            track = sp.track(track_url)
            artist = track["artists"][0]["name"]
            title = track["name"]
            print(f"✅ Found track: '{title}' by {artist}")
            return artist, title
        except Exception as e:
            print(f"❌ Error getting track info from Spotify: {e}")
            return None, None

    def download_audio_from_youtube(self, artist, title):
        """Download audio from YouTube for the given artist and title."""
        search_query = f"{artist} {title} audio"
        output_template = os.path.join(
            self.TEMP_AUDIO_DIR, f"{artist} - {title}.%(ext)s"
        )
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            "outtmpl": output_template,
            "default_search": "ytsearch1",
            "quiet": True,
            "no_warnings": True,
        }
        try:
            print(f"⏳ Downloading audio for '{title}'...")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(search_query, download=True)
                downloaded_filepath = (
                    ydl.prepare_filename(info_dict).rsplit(".", 1)[0] + ".mp3"
                )
                if os.path.exists(downloaded_filepath):
                    print(f"✅ Audio downloaded: {downloaded_filepath}")
                    return downloaded_filepath
                else:
                    print(
                        f"❌ Error: Could not find downloaded file: {downloaded_filepath}"
                    )
                    return None
        except Exception as e:
            print(f"❌ Error downloading audio: {e}")
            return None

    def extract_analysis(self, audio_filepath):
        """Run Essentia MusicExtractor and return analysis dict."""
        try:
            print(f"⏳ Analyzing track with Essentia...")
            extractor = es.MusicExtractor()
            features, _ = extractor(audio_filepath)
            descriptor_names = sorted(features.descriptorNames())
            analysis = {}
            for descriptor in descriptor_names:
                val = features[descriptor]
                if isinstance(val, np.ndarray):
                    analysis[descriptor] = val.tolist()
                elif isinstance(val, (np.float32, np.float64, np.intc)):
                    analysis[descriptor] = float(val)
                elif isinstance(val, (float, int, str, list)):
                    analysis[descriptor] = val
                else:
                    analysis[descriptor] = str(val)
            print(f"✅ Analysis complete.")
            return analysis
        except Exception as e:
            print(f"❌ Error during Essentia analysis: {e}")
            return None

    def extract_va_and_embeddings(self, audio_filepath):
        """Run MusiCNN embedding and VA prediction, return embeddings and VA dict."""
        try:
            from essentia.standard import (
                MonoLoader,
                TensorflowPredictMusiCNN,
                TensorflowPredict2D,
            )

            print(f"⏳ Running MusiCNN and VA prediction...")
            audio = MonoLoader(
                filename=audio_filepath, sampleRate=16000, resampleQuality=4
            )()
            embedding_model = TensorflowPredictMusiCNN(
                graphFilename="msd-musicnn-1.pb", output="model/dense/BiasAdd"
            )
            embeddings = embedding_model(audio)
            model = TensorflowPredict2D(
                graphFilename="deam-msd-musicnn-2.pb", output="model/Identity"
            )
            predictions = model(embeddings)
            predictions_np = np.array(predictions)

            # Normalize predictions to range -1 to 1
            min_vals = predictions_np.min(axis=0)
            max_vals = predictions_np.max(axis=0)
            # Avoid division by zero
            denom = np.where(max_vals - min_vals == 0, 1, max_vals - min_vals)
            normalized_predictions = 2 * (predictions_np - min_vals) / denom - 1

            valence_avg = (
                float(np.mean(normalized_predictions[:, 0]))
                if normalized_predictions.shape[1] > 0
                else None
            )
            arousal_avg = (
                float(np.mean(normalized_predictions[:, 1]))
                if normalized_predictions.shape[1] > 1
                else None
            )
            va = {
                "predictions": normalized_predictions.tolist(),
                "valence_average": valence_avg,
                "arousal_average": arousal_avg,
            }
            print(f"✅ VA and embeddings extraction complete.")
            return embeddings.tolist() if hasattr(
                embeddings, "tolist"
            ) else embeddings, va
        except Exception as e:
            print(f"❌ Error during VA/embedding extraction: {e}")
            return None, None

    def process_track(self, spotify_track_id):
        """Main method to process a track and return all results as a dict."""
        artist, title = self.get_spotify_track_info(spotify_track_id)
        if not artist:
            return None

        sanitized_title = "".join(
            c for c in title if c.isalnum() or c in (" ", "_")
        ).rstrip()
        output_filename = os.path.join(
            self.ANALYSIS_OUTPUT_DIR, f"{sanitized_title}.json"
        )
        if os.path.exists(output_filename):
            print(f"✅ Already analyzed: {output_filename}")
            with open(output_filename, "r") as f:
                return json.load(f)

        audio_filepath = None
        try:
            audio_filepath = self.download_audio_from_youtube(artist, title)
            if not audio_filepath:
                return None

            analysis = self.extract_analysis(audio_filepath)
            embeddings, va = self.extract_va_and_embeddings(audio_filepath)

            if analysis is not None and embeddings is not None and va is not None:
                result = {
                    "analysis": analysis,
                    "embeddings": embeddings,
                    "va": va,
                }
                # with open(output_filename, "w") as f:
                #     json.dump(result, f, indent=4, sort_keys=True)
                # print(f"✅ All results saved to: {output_filename}")
                return result
            else:
                return None
        finally:
            if audio_filepath and os.path.exists(audio_filepath):
                print(f"🧹 Cleaning up temporary file: {audio_filepath}")
                os.remove(audio_filepath)


# The TrackAnalyzer class can now be imported and used in main.py or any API handler.


def main():
    import sys

    if len(sys.argv) != 2:
        print("Usage: python analyze_track.py <spotify_track_id>")
        sys.exit(1)
    spotify_track_id = sys.argv[1]
    analyzer = TrackAnalyzer()
    result = analyzer.process_track(spotify_track_id)
    if result is not None:
        print("done")
    else:
        print("❌ Failed to analyze track.")


if __name__ == "__main__":
    main()
