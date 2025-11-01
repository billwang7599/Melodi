import os
from supabase import create_client, Client


class SupabaseConnection:
    def __init__(self, url=None, key=None):
        # Load from environment if not provided
        self.supabase_url = url or os.getenv("SUPABASE_URL")
        self.supabase_key = key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Supabase URL and Key must be set in environment or passed to constructor."
            )
        self.client: Client = create_client(self.supabase_url, self.supabase_key)

    def get_song_data_by_ids(self, song_ids, table="song_data"):
        """
        Fetch songs from Supabase table by a list of songIds.
        Returns a list of dicts with at least 'song_id', 'valence', and 'arousal' keys.
        """
        if not isinstance(song_ids, list):
            raise ValueError("song_ids must be a list")
        response = (
            self.client.table(table).select("*").in_("song_id", song_ids).execute()
        )
        if hasattr(response, "data"):
            return response.data
        return response  # fallback for older supabase-py versions

    def get_songs_by_id(self, song_ids: list[str], table="songs"):
        """
        Fetch a song from Supabase table by a songId.
        Returns a dict with at least 'song_id', 'valence', and 'arousal' keys.
        """
        response = (
            self.client.table(table)
            .select("song_name,artist_name")
            .in_("song_id", song_ids)
            .execute()
        )
        if hasattr(response, "data"):
            return response.data[0] if response.data else None
        return response  # fallback for older supabase-py versions

    def insert_song_data(
        self,
        song_id: int,
        valence: float = None,
        arousal: float = None,
        va_prediction: dict = None,
        embedding: dict = None,
        analysis: dict = None,
        table="song_data",
    ):
        """
        Insert a new row into the song_data table.
        All JSON fields should be passed as Python dicts and will be converted automatically.
        """
        payload = {
            "song_id": song_id,
            "valence": valence,
            "arousal": arousal,
            "va_prediction": va_prediction,
            "embedding": embedding,
            "analysis": analysis,
        }
        response = self.client.table(table).insert(payload).execute()
        return response


# Example usage:
# from supabase_connection import SupabaseConnection
# supabase = SupabaseConnection()
# songs = supabase.get_songs_by_ids(["id1", "id2"])
