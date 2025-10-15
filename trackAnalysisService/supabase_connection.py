import os
from supabase import create_client, Client


class SupabaseConnection:
    def __init__(self, url=None, key=None):
        # Load from environment if not provided
        self.supabase_url = url or os.getenv("SUPABASE_URL")
        self.supabase_key = key or os.getenv("SUPABASE_ANON_KEY")
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Supabase URL and Key must be set in environment or passed to constructor."
            )
        self.client: Client = create_client(self.supabase_url, self.supabase_key)

    def get_songs_by_ids(self, song_ids, table="songs"):
        """
        Fetch songs from Supabase table by a list of songIds.
        Returns a list of dicts with at least 'song_id', 'valence', and 'arousal' keys.
        """
        if not isinstance(song_ids, list):
            raise ValueError("song_ids must be a list")
        response = (
            self.client.table(table)
            .select("song_id,valence,arousal")
            .in_("song_id", song_ids)
            .execute()
        )
        if hasattr(response, "data"):
            return response.data
        return response  # fallback for older supabase-py versions


# Example usage:
# from supabase_connection import SupabaseConnection
# supabase = SupabaseConnection()
# songs = supabase.get_songs_by_ids(["id1", "id2"])
