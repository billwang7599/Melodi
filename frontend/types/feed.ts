export interface FeedPost {
  post_id: number;
  user_id: string;
  content: string;
  like_count: number;
  visibility: string;
  created_at: string;
  updated_at: string;
  isLiked?: boolean;
  users: {
    id: string;
    username: string;
    display_name: string | null;
  };
  songs: {
    song_id: string;
    spotify_id: string;
    song_name: string;
    artist_name: string;
    album_name: string | null;
    cover_art_url: string | null;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  album: {
    id: string;
    name: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
  external_urls: {
    spotify: string;
  };
}

export interface SelectedSong {
  spotifyId: string;
  name: string;
  artist: string;
}
