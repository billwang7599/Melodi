import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = '0f5c814e10af4468988d67d8fc1c99c7';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET ?? '';
const REDIRECT_URI = 'melodi://spotify-auth-callback';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProfileStats {
  totalPosts: number;
  totalFollowers: number;
  totalFollowing: number;
}

interface TopTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
}

interface TopArtist {
  id: string;
  name: string;
  image: string;
  genres: string[];
}

interface ListeningStats {
  totalMinutes: number;
  topGenre: string;
  danceability: number;
  energy: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
  duration_ms?: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
}

interface SongAnalysis {
  id: string;
  danceability?: number;
  energy?: number;
  valence?: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [loading, setLoading] = useState(true);
  const [timeRangeLoading, setTimeRangeLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
  });
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');

  // Spotify authentication
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: [
        'user-read-email',
        'user-library-read',
        'user-read-recently-played',
        'user-top-read',
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
      ],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    }
  );

  // Helper function to get Spotify access token
  const getSpotifyAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No Spotify access token found');
        return null;
      }
      
      // Check if token is expired
      const expirationDate = await AsyncStorage.getItem('expirationDate');
      if (expirationDate && Date.now() > parseInt(expirationDate, 10)) {
        console.log('Spotify access token expired');
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }, []);

  // Function to ensure song exists in backend and get its song_id
  const ensureSongExists = useCallback(async (spotifyId: string): Promise<number | null> => {
    try {
      // First, try to get the song by Spotify ID
      const getResponse = await fetch(
        `${API.BACKEND_URL}/api/songs/spotify/${spotifyId}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (getResponse.ok) {
        const data = await getResponse.json();
        return data.song?.song_id || null;
      }

      // If not found, create the song
      const createResponse = await fetch(`${API.BACKEND_URL}/api/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ spotifyId }),
      });

      if (createResponse.ok) {
        const data = await createResponse.json();
        return data.song?.song_id || null;
      }

      return null;
    } catch (error) {
      console.error('Error ensuring song exists:', error);
      return null;
    }
  }, []);

  // Function to get analytics for songs
  const getSongAnalytics = useCallback(async (songIds: number[]): Promise<SongAnalysis[]> => {
    try {
      const analyticsPromises = songIds.map(async (songId) => {
        // First, ensure analysis exists by creating it
        await fetch(`${API.BACKEND_URL}/api/analysis/song/${songId}`, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        // Then get the analysis
        const response = await fetch(`${API.BACKEND_URL}/api/analysis/song/${songId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          return await response.json();
        }
        return null;
      });

      const results = await Promise.all(analyticsPromises);
      return results.filter((result): result is SongAnalysis => result !== null);
    } catch (error) {
      console.error('Error getting song analytics:', error);
      return [];
    }
  }, []);

  // Function to load music data based on time range
  const loadMusicData = useCallback(async (timeRange: 'short_term' | 'medium_term' | 'long_term') => {
    try {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        console.log('No Spotify access token available');
        // Show empty state - user needs to authenticate
        setTopTracks([]);
        setTopArtists([]);
        setListeningStats(null);
        return;
      }

      // Fetch top tracks from Spotify
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!tracksResponse.ok) {
        throw new Error('Failed to fetch top tracks');
      }

      const tracksData: { items: SpotifyTrack[] } = await tracksResponse.json();
      
      // Process tracks: ensure they exist in backend and get song IDs
      const songIdPromises = tracksData.items.map((track) => ensureSongExists(track.id));
      const songIds = (await Promise.all(songIdPromises)).filter((id): id is number => id !== null);

      // Get analytics for all songs
      const analytics = await getSongAnalytics(songIds);

      // Map tracks to our format
      const processedTracks: TopTrack[] = tracksData.items.slice(0, 10).map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        albumArt: track.album.images?.[0]?.url || '',
        previewUrl: undefined,
      }));

      setTopTracks(processedTracks);

      // Fetch top artists from Spotify
      const artistsResponse = await fetch(
        `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      let artistsData: { items: SpotifyArtist[] } | null = null;
      if (artistsResponse.ok) {
        artistsData = await artistsResponse.json();
        if (artistsData) {
          const processedArtists: TopArtist[] = artistsData.items.slice(0, 10).map((artist) => ({
            id: artist.id,
            name: artist.name,
            image: artist.images?.[0]?.url || '',
            genres: artist.genres || [],
          }));
          setTopArtists(processedArtists);
        }
      }

      // Calculate listening stats from analytics
      if (analytics.length > 0) {
        // Analytics values are 0-1, convert to 0-100 percentage
        const totalDanceability = analytics.reduce((sum, a) => sum + (a.danceability || 0), 0);
        const totalEnergy = analytics.reduce((sum, a) => sum + (a.energy || 0), 0);
        const avgDanceability = Math.round((totalDanceability / analytics.length) * 100);
        const avgEnergy = Math.round((totalEnergy / analytics.length) * 100);

        // Calculate total minutes (estimate based on average track length)
        const totalDurationMs = tracksData.items.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
        const totalMinutes = Math.round(totalDurationMs / 60000);

        // Get top genre from artists
        let topGenre = 'Unknown';
        if (artistsData) {
          const allGenres = artistsData.items.flatMap((artist) => artist.genres || []);
          const genreCounts = allGenres.reduce((acc, genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
          topGenre = sortedGenres[0]?.[0] || 'Unknown';
          
          // Capitalize first letter
          topGenre = topGenre.charAt(0).toUpperCase() + topGenre.slice(1);
        }

        setListeningStats({
          totalMinutes,
          topGenre,
          danceability: avgDanceability,
          energy: avgEnergy,
        });
      }
    } catch (error) {
      console.error('Error loading music data:', error);
    }
  }, [getSpotifyAccessToken, ensureSongExists, getSongAnalytics]);

  // Exchange Spotify auth code for token
  const exchangeCodeForToken = useCallback(
    async (code: string) => {
      try {
        setAuthenticating(true);
        const body = `grant_type=authorization_code&code=${encodeURIComponent(
          code
        )}&redirect_uri=${encodeURIComponent(
          REDIRECT_URI
        )}&code_verifier=${encodeURIComponent(request?.codeVerifier || '')}`;

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
          },
          body: body,
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          const expirationDate = new Date(
            Date.now() + tokenData.expires_in * 1000
          ).getTime();
          await AsyncStorage.setItem('token', tokenData.access_token);
          await AsyncStorage.setItem('expirationDate', expirationDate.toString());

          Alert.alert('Success!', 'Successfully authenticated with Spotify!');
          
          // Reload music data after authentication
          await loadMusicData(selectedTimeRange);
        } else {
          Alert.alert('Error', 'Failed to get access token from Spotify');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to exchange code for token');
        console.error('Token exchange error:', error);
      } finally {
        setAuthenticating(false);
      }
    },
    [request, loadMusicData, selectedTimeRange]
  );

  // Handle Spotify auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Failed to authenticate with Spotify');
      setAuthenticating(false);
    }
  }, [response, exchangeCodeForToken]);

  // Refresh data periodically and when app becomes active
  // This ensures data is refreshed when user returns to the profile tab after authentication

  // Also listen to app state changes to refresh when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user) {
        // Reload data when app comes to foreground
        loadMusicData(selectedTimeRange);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, loadMusicData, selectedTimeRange]);

  // Load initial profile data (only runs once on mount)
  useEffect(() => {
    const loadInitialProfileData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API calls for profile stats (posts, followers, following)
        // For now, keep mock data for social stats
        setProfileStats({
          totalPosts: 42,
          totalFollowers: 128,
          totalFollowing: 89,
        });

        // Load initial music data which will also set listening stats
        await loadMusicData('medium_term');
      } catch (error) {
        console.error('Error loading initial profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadInitialProfileData();
    }
  }, [user]);

  // handle time range changes
  const handleTimeRangeChange = async (timeRange: 'short_term' | 'medium_term' | 'long_term') => {
    setSelectedTimeRange(timeRange);
    setTimeRangeLoading(true);
    await loadMusicData(timeRange);
    setTimeRangeLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const timeRangeLabels = {
    short_term: 'Last Month',
    medium_term: 'Last 6 Months',
    long_term: 'All Time',
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/profile/edit' as any)}
            >
              <IconSymbol name="gear" size={20} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={mutedColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: primaryColor }]}>
              <IconSymbol name="person.fill" size={40} color={primaryColor} />
            </View>
          </View>
          
          <ThemedText style={styles.displayName}>
            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Music Lover'}
          </ThemedText>
          
          {user?.email && (
            <ThemedText style={[styles.email, { color: mutedColor }]}>
              {user.email}
            </ThemedText>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalPosts}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Posts</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalFollowers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Followers</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalFollowing}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Following</ThemedText>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[styles.editButton, { borderColor }]}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <IconSymbol name="pencil" size={14} color={primaryColor} />
            <ThemedText style={[styles.editButtonText, { color: primaryColor }]}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Spotify Auth Prompt */}
        {!listeningStats && topTracks.length === 0 && !loading && (
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <IconSymbol name="music.note" size={32} color={primaryColor} style={styles.authIcon} />
              <ThemedText style={styles.authTitle}>Connect to Spotify</ThemedText>
              <ThemedText style={[styles.authMessage, { color: mutedColor }]}>
                To view your listening analytics, please authenticate with Spotify first.
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.authButton,
                  { backgroundColor: primaryColor, opacity: authenticating ? 0.6 : 1 },
                ]}
                onPress={() => {
                  if (request && !authenticating) {
                    promptAsync();
                  }
                }}
                disabled={authenticating || !request}
              >
                {authenticating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.authButtonText}>Login to Spotify</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Listening Stats */}
        {listeningStats && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Listening Stats</ThemedText>
            <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.listeningStatsGrid}>
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="clock.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {Math.round(listeningStats.totalMinutes / 60)}h
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Total Listened
                  </ThemedText>
                </View>
                
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="music.note" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.topGenre}
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Top Genre
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="figure.dance" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.danceability}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Danceability
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="bolt.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.energy}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Energy
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {(['short_term', 'medium_term', 'long_term'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && [styles.timeRangeButtonActive, { backgroundColor: primaryColor }],
                { borderColor },
              ]}
              onPress={() => handleTimeRangeChange(range)}
              disabled={timeRangeLoading}
            >
              <ThemedText
                style={[
                  styles.timeRangeText,
                  selectedTimeRange === range && styles.timeRangeTextActive,
                  selectedTimeRange !== range && { color: mutedColor },
                  timeRangeLoading && styles.timeRangeTextDisabled,
                ]}
              >
                {timeRangeLabels[range]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Tracks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Top Tracks</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {timeRangeLoading ? (
            <View style={styles.musicLoadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.musicLoadingText, { color: mutedColor }]}>
                Loading tracks...
              </ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {topTracks.map((track) => (
                <TouchableOpacity 
                  key={track.id} 
                  style={[styles.trackCard, { width: CARD_WIDTH }]}
                >
                  <Image
                    source={{ uri: track.albumArt }}
                    style={styles.trackImage}
                  />
                  <ThemedText style={styles.trackName} numberOfLines={2}>
                    {track.name}
                  </ThemedText>
                  <ThemedText style={[styles.trackArtist, { color: mutedColor }]} numberOfLines={1}>
                    {track.artist}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Artists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Top Artists</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {timeRangeLoading ? (
            <View style={styles.musicLoadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.musicLoadingText, { color: mutedColor }]}>
                Loading artists...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.artistsGrid}>
              {topArtists.map((artist) => (
                <TouchableOpacity 
                  key={artist.id} 
                  style={[styles.artistCard, { backgroundColor: surfaceColor, borderColor }]}
                >
                  <Image
                    source={{ uri: artist.image }}
                    style={styles.artistImage}
                  />
                  <ThemedText style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </ThemedText>
                  <ThemedText style={[styles.artistGenres, { color: mutedColor }]} numberOfLines={1}>
                    {artist.genres.slice(0, 2).join(', ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  listeningStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listeningStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  listeningStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  listeningStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    borderWidth: 0,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  timeRangeTextDisabled: {
    opacity: 0.5,
  },
  musicLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  musicLoadingText: {
    fontSize: 14,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  trackCard: {
    marginRight: 12,
  },
  trackImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
  },
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  artistCard: {
    width: (width - 48) / 3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistGenres: {
    fontSize: 10,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  authIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  authMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  authButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
