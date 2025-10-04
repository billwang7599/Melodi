import { getSupabase } from './supabase';

export class SpotifyAPI {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  // Get access token from current session
  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const supabaseClient = getSupabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session?.provider_token) {
        this.accessToken = session.provider_token;
        return this.accessToken;
      }
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
    }

    return null;
  }

  // Make authenticated Spotify API request
  private async makeSpotifyRequest(endpoint: string, options: RequestInit = {}) {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No Spotify access token available. Please authenticate first.');
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}. ${error.error?.message || ''}`);
    }

    return response.json();
  }

  // Get current user's Spotify profile
  async getCurrentUser() {
    return this.makeSpotifyRequest('/me');
  }

  // Get user's recently played tracks
  async getRecentlyPlayed(limit: number = 20) {
    return this.makeSpotifyRequest(`/me/player/recently-played?limit=${limit}`);
  }

  // Get user's top tracks
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20) {
    return this.makeSpotifyRequest(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
  }

  // Get user's top artists
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20) {
    return this.makeSpotifyRequest(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
  }

  // Get user's saved tracks
  async getSavedTracks(limit: number = 20, offset: number = 0) {
    return this.makeSpotifyRequest(`/me/tracks?limit=${limit}&offset=${offset}`);
  }

  // Get user's playlists
  async getUserPlaylists(limit: number = 20, offset: number = 0) {
    return this.makeSpotifyRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
  }

  // Search for tracks, artists, albums, or playlists
  async search(query: string, type: 'track' | 'artist' | 'album' | 'playlist' = 'track', limit: number = 20) {
    const encodedQuery = encodeURIComponent(query);
    return this.makeSpotifyRequest(`/search?q=${encodedQuery}&type=${type}&limit=${limit}`);
  }

  // Get track audio features
  async getTrackAudioFeatures(trackId: string) {
    return this.makeSpotifyRequest(`/audio-features/${trackId}`);
  }

  // Get recommendations based on seed tracks, artists, or genres
  async getRecommendations(params: {
    seed_tracks?: string[];
    seed_artists?: string[];
    seed_genres?: string[];
    limit?: number;
    [key: string]: any; // For audio feature target parameters
  }) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        queryParams.append(key, value.join(','));
      } else if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeSpotifyRequest(`/recommendations?${queryParams.toString()}`);
  }
}

// Create a singleton instance
export const spotifyAPI = new SpotifyAPI();

// Helper hook for React components
export const useSpotifyAPI = () => {
  return spotifyAPI;
};