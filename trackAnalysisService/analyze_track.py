import os
import json
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import yt_dlp
from dotenv import load_dotenv

import essentia.standard as es
import numpy as np
from supabase_connection import SupabaseConnection

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()


class TrackAnalyzer:
    TEMP_AUDIO_DIR = "temp_audio"

    def __init__(self):
        os.makedirs(self.TEMP_AUDIO_DIR, exist_ok=True)

    def get_supabase_track_info(self, track_id):
        """Get artist and title for a given track ID from Supabase."""
        try:
            supabase = SupabaseConnection()
            song_data = supabase.get_songs_by_id([track_id])
            if song_data:
                artist = song_data["artist_name"]
                title = song_data["song_name"]
                print(f"✅ Found track in Supabase: '{title}' by {artist}")
                return artist, title
            else:
                print(f"❌ No track found in Supabase for ID: {track_id}")
                return None, None
        except Exception as e:
            print(f"❌ Error getting track info from Supabase: {e}")
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
        """Main method to process a track and return all results as a dict.
        Checks Supabase song_data first; if exists, returns it, else creates and returns new data.
        """
        supabase = SupabaseConnection()
        # Check if song_data already exists
        existing_data = supabase.get_song_data_by_ids([int(spotify_track_id)])
        if existing_data and len(existing_data) > 0:
            print(
                f"✅ song_data already exists in Supabase for song_id {spotify_track_id}"
            )
            return existing_data[0]

        artist, title = self.get_supabase_track_info(spotify_track_id)
        if not artist:
            return None

        audio_filepath = None
        try:
            audio_filepath = self.download_audio_from_youtube(artist, title)
            if not audio_filepath:
                return None

            analysis = self.extract_analysis(audio_filepath)
            embeddings, va = self.extract_va_and_embeddings(audio_filepath)

            if analysis is not None and embeddings is not None and va is not None:
                # Insert results into Supabase song_data table
                try:
                    supabase.insert_song_data(
                        song_id=int(spotify_track_id),
                        valence=va["valence_average"],
                        arousal=va["arousal_average"],
                        va_prediction=va,
                        embedding=embeddings,
                        analysis=analysis,
                    )
                    print(f"✅ Results inserted into Supabase song_data table.")
                    # Query and return the full row just inserted
                    inserted_row = supabase.get_song_data_by_ids(
                        [int(spotify_track_id)]
                    )
                    if inserted_row and len(inserted_row) > 0:
                        return inserted_row[0]
                    else:
                        print(f"❌ Could not retrieve inserted row from Supabase.")
                        return None
                except Exception as e:
                    print(f"❌ Error inserting results into Supabase: {e}")
                    return None
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
