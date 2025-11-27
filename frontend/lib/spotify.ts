
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

// This is needed for the auth session to work properly
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_TOKEN_KEY = '@spotify_access_token';
const SPOTIFY_REFRESH_TOKEN_KEY = '@spotify_refresh_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = '@spotify_token_expiry';

export class SpotifyAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly CLIENT_ID = "0f5c814e10af4468988d67d8fc1c99c7";
  private readonly REDIRECT_URI = "melodi://spotify-auth-callback";
  // AuthSession.makeRedirectUri({
  //   scheme: 'melodi',
  //   path: 'spotify-auth-callback'
  // });

  // Spotify authorization scopes needed for user data
  private readonly SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-recently-played',
    'user-top-read',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
    this.loadTokensFromStorage();
  }

  // Load tokens from AsyncStorage
  private async loadTokensFromStorage() {
    try {
      const [storedToken, storedRefreshToken, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(SPOTIFY_TOKEN_KEY),
        AsyncStorage.getItem(SPOTIFY_REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(SPOTIFY_TOKEN_EXPIRY_KEY)
      ]);

      if (storedToken && storedExpiry) {
        this.accessToken = storedToken;
        this.refreshToken = storedRefreshToken;
        this.tokenExpiry = parseInt(storedExpiry, 10);
      }
    } catch (error) {
      console.error('Error loading tokens from storage:', error);
    }
  }

  // Save tokens to AsyncStorage
  private async saveTokensToStorage() {
    try {
      const promises = [
        this.accessToken ? AsyncStorage.setItem(SPOTIFY_TOKEN_KEY, this.accessToken) : AsyncStorage.removeItem(SPOTIFY_TOKEN_KEY),
        this.refreshToken ? AsyncStorage.setItem(SPOTIFY_REFRESH_TOKEN_KEY, this.refreshToken) : AsyncStorage.removeItem(SPOTIFY_REFRESH_TOKEN_KEY),
        this.tokenExpiry ? AsyncStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, this.tokenExpiry.toString()) : AsyncStorage.removeItem(SPOTIFY_TOKEN_EXPIRY_KEY)
      ];
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
    }
  }

  // Generate PKCE code verifier and challenge
  private async generatePKCECodes() {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge };
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = Crypto.getRandomBytes(length);
    return Array.from(values)
      .map((x: number) => possible[x % possible.length])
      .join('');
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    // Convert to base64url format
    return digest
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Authenticate user with PKCE flow
  async authenticate(): Promise<boolean> {
    try {
      console.log('========================================');
      console.log('Starting Spotify PKCE authentication...');
      console.log('Redirect URI:', this.REDIRECT_URI);
      console.log('========================================');

      const { codeVerifier, codeChallenge } = await this.generatePKCECodes();
      console.log('PKCE codes generated');

      // Store code verifier for later use
      await AsyncStorage.setItem('@spotify_code_verifier', codeVerifier);
      console.log('Code verifier stored');

      const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
        client_id: this.CLIENT_ID,
        response_type: 'code',
        redirect_uri: this.REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: this.SCOPES,
      }).toString()}`;

      console.log('Opening Spotify authorization URL...');
      console.log('Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.REDIRECT_URI
      );

      console.log('WebBrowser returned!');
      console.log('Result type:', result.type);
      console.log('Full result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        console.log('Result is success!');
        const resultUrl = (result as any).url;
        console.log('Result URL:', resultUrl);
        
        if (resultUrl) {
          console.log('Parsing URL for authorization code...');
          let code: string | null = null;
          
          try {
            const url = new URL(resultUrl);
            code = url.searchParams.get('code');
            console.log('Code from URL params:', code);
          } catch (e) {
            console.log('URL parsing failed, trying regex');
            const match = resultUrl.match(/[?&]code=([^&]+)/);
            if (match) {
              code = match[1];
              console.log('Code from regex:', code);
            }
          }
        
          if (!code) {
            console.error('No authorization code found in URL!');
            throw new Error('No authorization code received');
          }

          console.log('Authorization code received:', code);

          const storedCodeVerifier = await AsyncStorage.getItem('@spotify_code_verifier');

          if (!storedCodeVerifier) {
            console.error('Code verifier not found in storage!');
            throw new Error('Code verifier not found');
          }

          console.log('Code verifier retrieved from storage');
          console.log('Exchanging code for token...');

          // Exchange authorization code for access token
          const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: this.CLIENT_ID,
              grant_type: 'authorization_code',
              code,
              redirect_uri: this.REDIRECT_URI,
              code_verifier: storedCodeVerifier,
            }).toString(),
          });

          console.log('Token response status:', tokenResponse.status);

          if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            console.error('Token exchange error:', JSON.stringify(error, null, 2));
            throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
          }

          const tokenData = await tokenResponse.json();
          console.log('Token data received successfully');

          this.accessToken = tokenData.access_token;
          this.refreshToken = tokenData.refresh_token;
          // Set expiry time (subtract 5 minutes for safety)
          this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - (5 * 60 * 1000);

          await this.saveTokensToStorage();
          await AsyncStorage.removeItem('@spotify_code_verifier');

          console.log('========================================');
          console.log('Successfully authenticated with Spotify!');
          console.log('========================================');
          return true;
        } else {
          console.error('Success result but no URL found!');
        }
      }

      console.log('========================================');
      console.log('Authentication cancelled or failed');
      console.log('Result type was:', result.type);
      console.log('========================================');
      return false;
    } catch (error) {
      console.error('========================================');
      console.error('Spotify authentication error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      console.error('========================================');
      return false;
    }
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    try {
      console.log('Refreshing Spotify access token...');

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

      await this.saveTokensToStorage();

      console.log('Successfully refreshed Spotify access token');
      return true;
    } catch (error) {
      console.error('Failed to refresh Spotify access token:', error);
      // Clear tokens if refresh fails
      await this.logout();
      return false;
    }
  }

  // Get valid access token (refresh if needed)
  async getAccessToken(): Promise<string | null> {
    // Check if we need to refresh the token
    if (this.accessToken && this.tokenExpiry) {
      if (Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }
      // Token expired, try to refresh
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.accessToken;
      }
    }

    // No valid token available
    return null;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }

  // Logout and clear tokens
  async logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    await AsyncStorage.multiRemove([
      SPOTIFY_TOKEN_KEY,
      SPOTIFY_REFRESH_TOKEN_KEY,
      SPOTIFY_TOKEN_EXPIRY_KEY,
      '@spotify_code_verifier'
    ]);
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
      // If unauthorized, try to refresh token and retry once
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            ...options,
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });
          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({}));
            throw new Error(`Spotify API error: ${retryResponse.status} ${retryResponse.statusText}. ${error.error?.message || ''}`);
          }
          return retryResponse.json();
        }
      }
      
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