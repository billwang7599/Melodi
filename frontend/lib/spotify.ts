
export class SpotifyAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly CLIENT_ID = "0f5c814e10af4468988d67d8fc1c99c7";
  private readonly CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || "";

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  // Get access token using client credentials flow
  async getAccessToken(): Promise<string | null> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Getting new Spotify access token using client credentials...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        // Set expiry time (subtract 5 minutes for safety)
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
        
        console.log('Successfully obtained Spotify access token');
        return this.accessToken;
      } else {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      return null;
    }
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

  // Get track details
  async getTrack(trackId: string) {
    return this.makeSpotifyRequest(`/tracks/${trackId}`);
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

  // Get album details by ID
  async getAlbum(albumId: string) {
    return this.makeSpotifyRequest(`/albums/${albumId}`);
  }

  // Get artist details by ID (includes genres)
  async getArtist(artistId: string) {
    return this.makeSpotifyRequest(`/artists/${artistId}`);
  }

  // Get multiple artists by IDs (includes genres)
  async getArtists(artistIds: string[]) {
    const ids = artistIds.slice(0, 50).join(','); // Spotify allows max 50 IDs
    return this.makeSpotifyRequest(`/artists?ids=${ids}`);
  }
}

// Create a singleton instance
export const spotifyAPI = new SpotifyAPI();

// Helper hook for React components
export const useSpotifyAPI = () => {
  return spotifyAPI;
};